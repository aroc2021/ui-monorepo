/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************
import { existsSync, readFileSync } from "fs"
import axios from "axios"
import { ImployApiClient } from "@chainsafe/files-api-client"
// import webpackPreprocessor from "@cypress/webpack-preprocessor"
// @ts-check
import findWebpack from "find-webpack"
import webpackPreprocessor from "@cypress/webpack-preprocessor"
// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */


const readFileMaybe = (filename: string) => {
  if (existsSync(filename)) {
    return readFileSync(filename, "utf8")
  }

  return null
}

const clearCsfBucket = async ({ refreshToken, apiUrlBase }: {refreshToken: string; apiUrlBase: string}) => {
  // Disable the internal Axios JSON de serialization as this is handled by the client
  const axiosInstance = axios.create({ transformResponse: [] })
  const apiClient = new ImployApiClient({}, apiUrlBase, axiosInstance)

  try{
    // Get the access token and set it in the client for all subsequent calls
    console.log("refreshToken", refreshToken)
    const { access_token } = await apiClient.getRefreshToken({ refresh: refreshToken })

    console.log("access_token", access_token)
    apiClient.setToken(access_token.token)

    // get a list of all the files and folder from the root 
    const files = await apiClient.getCSFChildList({ path: "/", source: { type: "csf" } })

    console.log("files", files)
    const toDelete = files.map(({ name }: { name: string }) => `/${name}`)

    // delete them all
    await apiClient.removeCSFObjects({ paths: toDelete, source: { type: "csf" } })
  } catch (e) {
    console.error(e)
    throw new Error(e)
  }
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (on: Cypress.PluginEvents, _config: Cypress.ConfigOptions) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  // const defaults = webpackPreprocessor.defaultOptions
  // on("file:preprocessor", webpackPreprocessor(defaults))

  // find the Webpack config used by react-scripts
  const webpackOptions = findWebpack.getWebpackOptions()

  if (!webpackOptions) {
    throw new Error("Could not find Webpack in this project 😢")
  }

  // use a module that carefully removes only plugins
  // that we found to be breaking the bundling
  // https://github.com/bahmutov/find-webpack
  const cleanOptions = {
    reactScripts: true
  }

  findWebpack.cleanForCypress(cleanOptions, webpackOptions)

  const options = {
    webpackOptions,
    watchOptions: {}
  }

  on("file:preprocessor", webpackPreprocessor(options))

  on("task", {
    readFileMaybe,
    clearCsfBucket
  })
}
