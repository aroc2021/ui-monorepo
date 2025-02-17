import * as React from "react"
import { useCallback, useEffect } from "react"
import { useFilesApi } from "./FilesApiContext"
import { useState } from "react"
import { t } from "@lingui/macro"
import { DISMISSED_SHARING_EXPLAINER_KEY } from "../Components/Modules/FileBrowsers/hooks/useSharingExplainerModalFlag"
import { DISMISSED_SURVEY_KEY } from "../Components/SurveyBanner"
import { Details } from "@chainsafe/files-api-client"

type UserContextProps = {
  children: React.ReactNode | React.ReactNode[]
}

export type Profile = {
  userId: string
  firstName?: string
  lastName?: string
  publicAddress?: string
  email?: string
  createdAt?: Date
  username?: string
}

interface ILocalStore {
  [key: string]: any
}

interface IUserContext {
  profile: Profile | undefined
  localStore: ILocalStore | undefined
  setLocalStore: (newData: ILocalStore, method?: "update" | "overwrite") => void
  refreshProfile(): Promise<void>
  updateProfile: (
    firstName: string,
    lastName: string,
    // email: string,
  ) => Promise<void>
  lookupOnUsername: (username: string) => Promise<boolean>
  addUsername: (username: string) => Promise<void>
  removeUser(): void
  getProfileTitle(): string
}

const UserContext = React.createContext<IUserContext | undefined>(undefined)


const UserProvider = ({ children }: UserContextProps) => {
  const { filesApiClient, isLoggedIn } = useFilesApi()
  const [profile, setProfile] = useState<Profile | undefined>(undefined)
  const [localStore, _setLocalStore] = useState<ILocalStore | undefined>()

  const setLocalStore = useCallback((newData: ILocalStore, method: "update" | "overwrite" = "update") => {

    const toStore = method === "update"
      ? { ...localStore, ...newData }
      : newData

    filesApiClient.updateUserLocalStore(toStore)
      .then(_setLocalStore)
      .catch(console.error)

  }, [filesApiClient, localStore])

  const refreshProfile = useCallback(async () => {
    try {
      const profileApiData = await filesApiClient.getUser()

      const profileState = {
        userId: profileApiData.uuid,
        firstName: profileApiData.first_name,
        lastName: profileApiData.last_name,
        email: profileApiData.email,
        publicAddress: profileApiData.public_address?.toLowerCase(),
        createdAt: profileApiData.created_at,
        username: profileApiData.username
      }
      setProfile(profileState)
      return Promise.resolve()
    } catch (error) {
      console.error(error)
      return Promise.reject("There was an error getting profile.")
    }
  }, [filesApiClient])

  const initLocalStore = useCallback((apiStore: ILocalStore | undefined) => {
    let initStore = apiStore || {}

    if (apiStore?.[DISMISSED_SHARING_EXPLAINER_KEY] === undefined) {
      initStore = { ...initStore, [DISMISSED_SHARING_EXPLAINER_KEY]: "false" }
    }

    if (apiStore?.[DISMISSED_SURVEY_KEY] === undefined) {
      initStore = { ...initStore, [DISMISSED_SURVEY_KEY]: "false" }
    }

    _setLocalStore(initStore)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    filesApiClient.getUserLocalStore()
      .then((apiStore) => {
        initLocalStore(apiStore)
      })
      .catch((e) => {
        console.error(e)
        initLocalStore({})
      })
  }, [isLoggedIn, filesApiClient, initLocalStore])

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    refreshProfile()
      .catch(console.error)

  }, [isLoggedIn, refreshProfile])

  const updateProfile = async (firstName?: string, lastName?: string) => {
    if (!profile) return Promise.reject("Profile not initialized")

    try {
      const profileData = await filesApiClient.updateUser({
        first_name: firstName || "",
        last_name: lastName || "",
        email: profile.email || "",
        username: profile.username
      })

      setProfile({
        ...profile,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        email: profileData.email,
        publicAddress: profileData.public_address
      })
      return Promise.resolve()
    } catch (error: any) {
      console.error(error)
      return Promise.reject(
        Array.isArray(error.error.details)
          ? error.error.details.map((e: Details) => e.message).join(",")
          : t`There was an error when setting username.`
      )
    }
  }

  // separate function to set username
  // using the same update profile API
  const addUsername = async (username: string) => {
    if (!profile) return Promise.reject("Profile not initialized")

    try {
      await filesApiClient.updateUser({
        first_name: profile.firstName || "",
        last_name: profile.lastName || "",
        email: profile.email || "",
        username
      })

      setProfile({
        ...profile,
        username
      })
      return Promise.resolve()
    } catch (error: any) {
      console.error(error)
      return Promise.reject(
        Array.isArray(error.error.details)
          ? error.error.details.map((e: Details) => e.message).join(",")
          : t`There was an error when setting username.`
      )
    }
  }

  const lookupOnUsername = async (username: string) => {
    if (!profile) return false
    try {
      const alreadyExists = await filesApiClient.lookupUser({ username })
      return !!alreadyExists
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const removeUser = useCallback(() => {
    setProfile(undefined)
    _setLocalStore(undefined)
  }, [])

  const getProfileTitle = () => {
    if (profile?.publicAddress) {
      const { publicAddress } = profile
      return `${publicAddress.substr(0, 6)}...${publicAddress.substr(
        publicAddress.length - 6,
        publicAddress.length
      )}`
    } else {
      return profile?.firstName || profile?.email || ""
    }
  }

  return (
    <UserContext.Provider
      value={{
        localStore,
        setLocalStore,
        profile,
        updateProfile,
        refreshProfile,
        removeUser,
        addUsername,
        lookupOnUsername,
        getProfileTitle
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

const useUser = () => {
  const context = React.useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export { UserProvider, useUser }
