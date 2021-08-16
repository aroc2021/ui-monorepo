import {
  FileContentResponse,
  DirectoryContentResponse,
  BucketType,
  Bucket as FilesBucket,
  SearchEntry,
  BucketFileFullInfoResponse,
  BucketSummaryResponse,
  LookupUser
} from "@chainsafe/files-api-client"
import React, { useCallback, useEffect, useReducer } from "react"
import { useState } from "react"
import { decryptFile, encryptFile  } from "../Utils/encryption"
import { v4 as uuidv4 } from "uuid"
import { useToaster } from "@chainsafe/common-components"
import { downloadsInProgressReducer, uploadsInProgressReducer } from "./FilesReducers"
import axios, { CancelToken } from "axios"
import { t } from "@lingui/macro"
import { readFileAsync } from "../Utils/Helpers"
import { useBeforeunload } from "react-beforeunload"
import { useThresholdKey } from "./ThresholdKeyContext"
import { useFilesApi } from "./FilesApiContext"
import { useUser } from "./UserContext"
import { getPathWithFile } from "../Utils/pathUtils"

type FilesContextProps = {
  children: React.ReactNode | React.ReactNode[]
}

export type UploadProgress = {
  id: string
  fileName: string
  progress: number
  error: boolean
  errorMessage?: string
  complete: boolean
  noOfFiles: number
  path: string
}

export type DownloadProgress = {
  id: string
  fileName: string
  progress: number
  error: boolean
  errorMessage?: string
  complete: boolean
}

export type SharedFolderUser = {
  uuid: string
  pubKey: string
}

export type UpdateSharedFolderUser = {
  uuid: string
  pubKey?: string
  encryption_key?: string
}

interface GetFileContentParams {
  cid: string
  cancelToken?: CancelToken
  onDownloadProgress?: (progressEvent: ProgressEvent<EventTarget>) => void
  file: FileSystemItem
  path: string
}

export type BucketPermission = "writer" | "owner" | "reader"

export type BucketKeyPermission = Omit<FilesBucket, "owners" | "writers" | "readers"> & {
  encryptionKey: string
  permission?: BucketPermission
  owners: LookupUser[]
  writers: LookupUser[]
  readers: LookupUser[]
}

type FilesContext = {
  buckets: BucketKeyPermission[]
  uploadsInProgress: UploadProgress[]
  downloadsInProgress: DownloadProgress[]
  storageSummary: BucketSummaryResponse | undefined
  personalEncryptionKey: string | undefined
  getStorageSummary: () => Promise<void>
  uploadFiles: (bucketId: string, files: File[], path: string, encryptionKey?: string) => Promise<void>
  downloadFile: (bucketId: string, itemToDownload: FileSystemItem, path: string) => void
  getFileContent: (bucketId: string, params: GetFileContentParams) => Promise<Blob | undefined>
  refreshBuckets: (showLoading?: boolean) => Promise<void>
  secureAccountWithMasterPassword: (candidatePassword: string) => Promise<void>
  isLoadingBuckets?: boolean
  createSharedFolder: (
    name: string,
    writers?: SharedFolderUser[],
    readers?: SharedFolderUser[]
  ) => Promise<BucketKeyPermission | void>
  editSharedFolder: (
    bucket: BucketKeyPermission,
    writers?: UpdateSharedFolderUser[],
    readers?: UpdateSharedFolderUser[]
  ) => Promise<void>
}

// This represents a File or Folder on the
export interface IFileSystemItem extends FileContentResponse {
  isFolder: boolean
}

type FileSystemItem = IFileSystemItem

const REMOVE_UPLOAD_PROGRESS_DELAY = 5000
const MAX_FILE_SIZE = 2 * 1024 ** 3

const FilesContext = React.createContext<FilesContext | undefined>(undefined)

const FilesProvider = ({ children }: FilesContextProps) => {
  const {
    filesApiClient,
    isLoggedIn,
    secured,
    secureThresholdKeyAccount,
    encryptedEncryptionKey,
    isMasterPasswordSet,
    validateMasterPassword
  } = useFilesApi()
  const { publicKey, encryptForPublicKey, decryptMessageWithThresholdKey } = useThresholdKey()
  const { addToastMessage } = useToaster()
  const [personalEncryptionKey, setPersonalEncryptionKey] = useState<string | undefined>()
  const [buckets, setBuckets] = useState<BucketKeyPermission[]>([])
  const [storageSummary, setStorageSummary] = useState<BucketSummaryResponse | undefined>()
  const { profile } = useUser()
  const { userId } = profile || {}
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false)

  const getStorageSummary = useCallback(async () => {
    try {
      const bucketSummaryData = await filesApiClient.bucketsSummary()
      setStorageSummary(bucketSummaryData)
    } catch (error) {
      console.error(error)
    }
  }, [filesApiClient, setStorageSummary])

  const getPermissionForBucket = useCallback((bucket: FilesBucket) => {
    return bucket.owners.find(owner => owner.uuid === userId)
      ? "owner" as BucketPermission
      : bucket.writers.find(writer => writer.uuid === userId)
        ? "writer" as BucketPermission
        : bucket.readers.find(reader => reader.uuid === userId)
          ? "reader" as BucketPermission
          : undefined
  }, [userId])

  const getKeyForSharedBucket = useCallback(async (bucket: FilesBucket) => {
    const bucketUsers = [...bucket.readers, ...bucket.writers, ...bucket.owners]
    const bucketUser = bucketUsers.find(bu => bu.uuid === userId)

    if (!bucketUser?.encryption_key) {
      console.error(`Unable to retrieve encryption key for ${bucket.id}`)
      return ""
    }

    const decrypted = await decryptMessageWithThresholdKey(bucketUser.encryption_key)

    return decrypted || ""
  }, [decryptMessageWithThresholdKey, userId])

  const getKeyForBucket = useCallback(async (bucket: FilesBucket) => {
    if (!personalEncryptionKey || !userId) return

    let encryptionKey = ""

    switch(bucket.type) {
    case "csf":
    case "trash": {
      encryptionKey = personalEncryptionKey
      break
    }
    case "share": {
      encryptionKey = await getKeyForSharedBucket(bucket)
      break
    }}

    return encryptionKey
  }, [getKeyForSharedBucket, personalEncryptionKey, userId])

  const refreshBuckets = useCallback(async (showLoading?: boolean) => {
    if (!personalEncryptionKey || !userId) return

    showLoading && setIsLoadingBuckets(true)
    const result = await filesApiClient.listBuckets()

    const bucketsWithKeys: BucketKeyPermission[] = await Promise.all(
      result.map(async (b) => {
        const userData = await filesApiClient.getBucketUsers(b.id)
        return {
          ...b,
          encryptionKey: await getKeyForBucket(b) || "",
          permission: getPermissionForBucket(b),
          owners: userData.owners || [],
          writers: userData.writers || [],
          readers: userData.readers || []
        }
      })
    )
    setBuckets(bucketsWithKeys)
    setIsLoadingBuckets(false)
    getStorageSummary()
    return Promise.resolve()
  }, [personalEncryptionKey, userId, filesApiClient, getStorageSummary, getKeyForBucket, getPermissionForBucket])

  useEffect(() => {
    refreshBuckets(true)
  }, [refreshBuckets])

  // Space used counter
  useEffect(() => {
    if (isLoggedIn) {
      getStorageSummary()
    }
  }, [isLoggedIn, getStorageSummary, profile])

  // Reset encryption keys on log out
  useEffect(() => {
    if (!isLoggedIn) {
      setPersonalEncryptionKey(undefined)
      setBuckets([])
    }
  }, [isLoggedIn])

  const secureAccount = useCallback(() => {
    if (!publicKey) return

    const key = Buffer.from(
      window.crypto.getRandomValues(new Uint8Array(32))
    ).toString("base64")
    console.log("New key", key)
    setPersonalEncryptionKey(key)
    encryptForPublicKey(publicKey, key)
      .then((encryptedKey) => {
        console.log("Encrypted encryption key", encryptedKey)
        secureThresholdKeyAccount(encryptedKey)
      })
      .catch(console.error)
  }, [encryptForPublicKey, publicKey, secureThresholdKeyAccount])

  const decryptKey = useCallback((encryptedKey: string) => {
    console.log("Decrypting retrieved key")

    decryptMessageWithThresholdKey(encryptedKey)
      .then((decryptedKey) => {
        console.log("Decrypted key: ", decryptedKey)
        setPersonalEncryptionKey(decryptedKey)
      })
      .catch(console.error)
  }, [decryptMessageWithThresholdKey])

  // Drive encryption handler
  useEffect(() => {
    if (isLoggedIn && publicKey && !personalEncryptionKey) {
      console.log("Checking whether account is secured ", secured)

      if (!secured && !isMasterPasswordSet) {
        console.log("Generating key and securing account")
        secureAccount()
      } else {
        console.log("decrypting key")
        if (encryptedEncryptionKey) {
          decryptKey(encryptedEncryptionKey)
        }
      }
    }
  }, [
    secured,
    isLoggedIn,
    encryptedEncryptionKey,
    publicKey,
    encryptForPublicKey,
    secureThresholdKeyAccount,
    decryptMessageWithThresholdKey,
    personalEncryptionKey,
    isMasterPasswordSet,
    secureAccount,
    decryptKey,
    isLoadingBuckets
  ])

  const secureAccountWithMasterPassword = async (candidatePassword: string) => {
    if (!publicKey || !validateMasterPassword(candidatePassword)) return

    const encryptedKey = await encryptForPublicKey(publicKey, candidatePassword)
    setPersonalEncryptionKey(candidatePassword)
    secureThresholdKeyAccount(encryptedKey)
  }

  const [uploadsInProgress, dispatchUploadsInProgress] = useReducer(
    uploadsInProgressReducer,
    []
  )

  const [downloadsInProgress, dispatchDownloadsInProgress] = useReducer(
    downloadsInProgressReducer,
    []
  )

  const [closeIntercept, setCloseIntercept] = useState<string | undefined>()

  useEffect(() => {
    if (downloadsInProgress.length > 0) {
      setCloseIntercept("Download in progress, are you sure?")
    } else if (uploadsInProgress.length > 0) {
      setCloseIntercept("Upload in progress, are you sure?")
    } else if (closeIntercept !== undefined) {
      setCloseIntercept(undefined)
    }
  }, [closeIntercept, downloadsInProgress, uploadsInProgress])

  useBeforeunload(() => {
    if (closeIntercept !== undefined) {
      return closeIntercept
    }
  })

  const uploadFiles = useCallback(async (bucketId: string, files: File[], path: string, encryptionKey?: string) => {
    const key = encryptionKey || buckets.find(b => b.id === bucketId)?.encryptionKey

    if (!key) {
      console.error("No encryption key for this bucket available.")
      return
    }

    const id = uuidv4()
    const uploadProgress: UploadProgress = {
      id,
      fileName: files[0].name, // TODO: Do we need this?
      complete: false,
      error: false,
      noOfFiles: files.length,
      progress: 0,
      path
    }
    dispatchUploadsInProgress({ type: "add", payload: uploadProgress })
    const hasOversizedFile = files.some(file => file.size > MAX_FILE_SIZE)

    if (hasOversizedFile) {
      addToastMessage({
        message:
            t`We can't encrypt files larger than 2GB. Some items will not be uploaded`,
        appearance: "error"
      })
    }

    try {
      const filesParam = await Promise.all(
        files
          .filter((f) => f.size <= MAX_FILE_SIZE)
          .map(async (f) => {
            const fileData = await readFileAsync(f)
            const encryptedData = await encryptFile(fileData, key)
            return {
              data: new Blob([encryptedData], { type: f.type }),
              fileName: f.name
            }
          })
      )

      await filesApiClient.uploadBucketObjects(
        bucketId,
        filesParam,
        path,
        undefined,
        1,
        undefined,
        undefined,
        (progressEvent: { loaded: number; total: number }) => {
          dispatchUploadsInProgress({
            type: "progress",
            payload: {
              id,
              progress: Math.ceil(
                (progressEvent.loaded / progressEvent.total) * 100
              )
            }
          })
        }
      )
      refreshBuckets()
      // setting complete
      dispatchUploadsInProgress({ type: "complete", payload: { id } })
      setTimeout(() => {
        dispatchUploadsInProgress({ type: "remove", payload: { id } })
      }, REMOVE_UPLOAD_PROGRESS_DELAY)

      return Promise.resolve()
    } catch (error) {
      console.error(error)
      // setting error
      let errorMessage = t`Something went wrong. We couldn't upload your file`

      // we will need a method to parse server errors
      if (Array.isArray(error) && error[0].message.includes("conflict")) {
        errorMessage = t`A file with the same name already exists`
      }
      dispatchUploadsInProgress({
        type: "error",
        payload: { id, errorMessage }
      })
      setTimeout(() => {
        dispatchUploadsInProgress({ type: "remove", payload: { id } })
      }, REMOVE_UPLOAD_PROGRESS_DELAY)

      return Promise.reject(error)
    }
  }, [addToastMessage, filesApiClient, buckets, refreshBuckets])

  const getFileContent = useCallback(async (
    bucketId: string,
    { cid, cancelToken, onDownloadProgress, file, path }: GetFileContentParams
  ) => {

    const key = buckets.find(b => b.id === bucketId)?.encryptionKey

    if (!key) {
      throw new Error("No encryption key for this bucket found")
    }

    // when a file is accessed from the search page, a file  and a path are passed in
    // because the current path will not reflect the right state of the app 
    const fileToGet = file

    if (!fileToGet) {
      console.error("No file passed, and no file found for cid:", cid, "in pathContents:", path)
      throw new Error("No file found.")
    }

    try {
      const result = await filesApiClient.getBucketObjectContent(
        bucketId,
        { path: path },
        cancelToken,
        onDownloadProgress
      )

      if (fileToGet.version === 0) {
        return result.data
      } else {
        const decrypted = await decryptFile(
          await result.data.arrayBuffer(),
          key
        )
        if (decrypted) {
          return new Blob([decrypted], {
            type: fileToGet.content_type
          })
        }
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return Promise.reject()
      } else {
        console.error(error)
        return Promise.reject(error)
      }
    }
  }, [buckets, filesApiClient])

  const downloadFile = useCallback(async (bucketId: string, itemToDownload: FileSystemItem, path: string) => {
    const toastId = uuidv4()
    try {
      const downloadProgress: DownloadProgress = {
        id: toastId,
        fileName: itemToDownload.name,
        complete: false,
        error: false,
        progress: 0
      }
      dispatchDownloadsInProgress({ type: "add", payload: downloadProgress })
      const result = await getFileContent(bucketId, {
        cid: itemToDownload.cid,
        file: itemToDownload,
        path: getPathWithFile(path, itemToDownload.name),
        onDownloadProgress: (progressEvent) => {
          dispatchDownloadsInProgress({
            type: "progress",
            payload: {
              id: toastId,
              progress: Math.ceil(
                (progressEvent.loaded / itemToDownload.size) * 100
              )
            }
          })
        }
      })
      if (!result) return
      const link = document.createElement("a")
      link.href = URL.createObjectURL(result)
      link.download = itemToDownload?.name || "file"
      link.click()
      dispatchDownloadsInProgress({
        type: "complete",
        payload: { id: toastId }
      })
      URL.revokeObjectURL(link.href)
      setTimeout(() => {
        dispatchDownloadsInProgress({
          type: "remove",
          payload: { id: toastId }
        })
      }, REMOVE_UPLOAD_PROGRESS_DELAY)
      return Promise.resolve()
    } catch (error) {
      dispatchDownloadsInProgress({ type: "error", payload: { id: toastId } })
      return Promise.reject()
    }
  }, [getFileContent])

  const createSharedFolder = useCallback(async (name: string, writerUsers?: SharedFolderUser[], readerUsers?: SharedFolderUser[]) =>  {
    if (!publicKey) return

    const bucketEncryptionKey = Buffer.from(
      window.crypto.getRandomValues(new Uint8Array(32))
    ).toString("base64")

    const ownerEncryptedEncryptionKey = await encryptForPublicKey(publicKey, bucketEncryptionKey)

    const readers = readerUsers ? await Promise.all(readerUsers?.map(async u => ({
      uuid: u.uuid,
      encryption_key: await encryptForPublicKey(u.pubKey, bucketEncryptionKey)
    }))) : []

    const writers = writerUsers ? await Promise.all(writerUsers?.map(async u => ({
      uuid: u.uuid,
      encryption_key: await encryptForPublicKey(u.pubKey, bucketEncryptionKey)
    }))) : []

    return filesApiClient.createBucket({
      name,
      encryption_key: ownerEncryptedEncryptionKey,
      type: "share",
      readers,
      writers
    }).then(async (bucket) => {
      refreshBuckets(false)

      return {
        ...bucket,
        encryptionKey: await getKeyForBucket(bucket) || "",
        permission: getPermissionForBucket(bucket)
      } as BucketKeyPermission
    })
      .catch(console.error)
  }, [publicKey, encryptForPublicKey, filesApiClient, refreshBuckets, getKeyForBucket, getPermissionForBucket])

  const editSharedFolder = useCallback(
    async (bucket: BucketKeyPermission, writerUsers?: UpdateSharedFolderUser[], readerUsers?: UpdateSharedFolderUser[]) => {
      if (!publicKey) return

      const readers = readerUsers ? await Promise.all(readerUsers?.map(async u => {
        return u.pubKey ? {
          uuid: u.uuid,
          encryption_key: await encryptForPublicKey(u.pubKey, bucket.encryptionKey)
        } : {
          uuid: u.uuid,
          encryption_key: u.encryption_key
        }
      })) : []

      const writers = writerUsers ? await Promise.all(writerUsers?.map(async u => {
        return u.pubKey ? {
          uuid: u.uuid,
          encryption_key: await encryptForPublicKey(u.pubKey, bucket.encryptionKey)
        } : {
          uuid: u.uuid,
          encryption_key: u.encryption_key
        }
      })) : []

      return filesApiClient.updateBucket(bucket.id, {
        name: bucket.name,
        readers,
        writers
      }).then(() => refreshBuckets(false))
        .catch(console.error)
    }, [filesApiClient, encryptForPublicKey, publicKey, refreshBuckets])

  return (
    <FilesContext.Provider
      value={{
        uploadFiles,
        downloadFile,
        getFileContent,
        personalEncryptionKey,
        uploadsInProgress,
        storageSummary,
        getStorageSummary,
        downloadsInProgress,
        secureAccountWithMasterPassword,
        buckets,
        refreshBuckets,
        isLoadingBuckets,
        createSharedFolder,
        editSharedFolder
      }}
    >
      {children}
    </FilesContext.Provider>
  )
}

const useFiles = () => {
  const context = React.useContext(FilesContext)
  if (context === undefined) {
    throw new Error("useFiles must be used within a FilesProvider")
  }
  return context
}

export { FilesProvider, useFiles }
export type {
  FileSystemItem,
  DirectoryContentResponse,
  BucketFileFullInfoResponse as FileFullInfo,
  BucketType,
  SearchEntry
}
