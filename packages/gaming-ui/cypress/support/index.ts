/// <reference types="cypress" />
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
// Import commands.js using ES2015 syntax:
import "./commands"

// the following gets rid of the exception "ResizeObserver loop limit exceeded"
// which someone on the internet says we can safely ignore
// source https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
Cypress.on("uncaught:exception", (err) => {
  /* returning false here prevents Cypress from failing the test */
  if (err.message.includes("ResizeObserver loop limit exceeded")) {
    // returning false here prevents Cypress from
    // failing the test
    return false
  }
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
