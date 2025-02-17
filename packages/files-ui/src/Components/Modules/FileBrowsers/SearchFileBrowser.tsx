import React, { useCallback, useEffect, useMemo, useState } from "react"
import { FileSystemItem, SearchEntry, useFiles } from "../../../Contexts/FilesContext"
import { IFileBrowserModuleProps, IFilesTableBrowserProps } from "./types"
import FilesList from "./views/FilesList"
import { CONTENT_TYPES } from "../../../Utils/Constants"
import DragAndDrop from "../../../Contexts/DnDContext"
import { useHistory, useLocation, useToasts } from "@chainsafe/common-components"
import { getArrayOfPaths, getParentPathFromFilePath, getURISafePathFromArray } from "../../../Utils/pathUtils"
import { ROUTE_LINKS } from "../../FilesRoutes"
import { t } from "@lingui/macro"
import { FileBrowserContext } from "../../../Contexts/FileBrowserContext"
import { useFilesApi } from "../../../Contexts/FilesApiContext"

const SearchFileBrowser: React.FC<IFileBrowserModuleProps> = ({ controls = false }: IFileBrowserModuleProps) => {
  const { pathname } = useLocation()
  const { filesApiClient } = useFilesApi()
  const { buckets } = useFiles()
  const searchTerm = useMemo(() => decodeURIComponent(pathname.split("/").slice(2)[0]), [pathname])
  const { redirect } = useHistory()

  const { addToast } = useToasts()

  const bucket = useMemo(() => buckets.find(b => b.type === "csf"), [buckets])

  const getSearchResults = useCallback(async (searchString: string) => {
    try {
      if (!searchString || !bucket) return []

      const results = await filesApiClient.searchFiles({ bucket_id: bucket.id, query: searchString })
      return results
    } catch (err) {
      addToast({
        title: t`There was an error getting search results`,
        type: "error"
      })
      return Promise.reject(err)
    }
  }, [addToast, bucket, filesApiClient])

  useEffect(() => {
    getSearchResults(searchTerm)
      .then(setSearchResults)
      .catch(console.error)
  }, [searchTerm, getSearchResults])

  const [loadingSearchResults, setLoadingSearchResults] = useState(true)
  const [searchResults, setSearchResults] = useState<SearchEntry[]>([])


  useEffect(() => {
    const onSearch = async () => {
      if (searchTerm) {
        try {
          setLoadingSearchResults(true)
          const results = await getSearchResults(searchTerm)
          setSearchResults(results)
          setLoadingSearchResults(false)
        } catch {
          setLoadingSearchResults(false)
        }
      }
    }
    onSearch()
    // eslint-disable-next-line
  }, [searchTerm])

  const getSearchEntry = useCallback((cid: string) =>
    searchResults.find(
      (result) => result.content.cid === cid
    )
  , [searchResults])

  const viewFolder = (cid: string) => {
    const searchEntry = getSearchEntry(cid)
    if (searchEntry) {
      if (searchEntry.content.content_type === CONTENT_TYPES.Directory) {
        redirect(ROUTE_LINKS.Drive(getURISafePathFromArray(getArrayOfPaths(searchEntry.path))))
      } else {
        redirect(ROUTE_LINKS.Drive(getURISafePathFromArray(getArrayOfPaths(getParentPathFromFilePath(searchEntry.path)))))
      }
    }
  }

  const getPath = useCallback((cid: string): string => {
    const searchEntry = getSearchEntry(cid)
    // Set like this as look ups should always be using available cids
    return searchEntry ? searchEntry.path : ""
  }, [getSearchEntry])

  const pathContents: FileSystemItem[] = useMemo(() =>
    searchResults.map((searchResult) => ({
      ...searchResult.content,
      isFolder: (searchResult.content.content_type === CONTENT_TYPES.Directory)
    }))
  , [searchResults])

  const itemOperations: IFilesTableBrowserProps["itemOperations"] = useMemo(() => ({
    [CONTENT_TYPES.File]: ["view_folder"],
    [CONTENT_TYPES.Directory]: ["view_folder"]
  }), [])

  return (
    <FileBrowserContext.Provider value={{
      crumbs: undefined,
      loadingCurrentPath: loadingSearchResults,
      showUploadsInTable: false,
      viewFolder,
      sourceFiles: pathContents,
      moduleRootPath: undefined,
      currentPath: searchTerm,
      heading: t`Search results`,
      controls,
      itemOperations,
      isSearch: true,
      getPath
    }}>
      <DragAndDrop>
        <FilesList />
      </DragAndDrop>
    </FileBrowserContext.Provider>
  )
}

export default SearchFileBrowser
