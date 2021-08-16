import { authenticationPage } from "../support/page-objects/authenticationPage"
import { navigationMenu } from "../support/page-objects/navigationMenu"
import { homePage } from "../support/page-objects/homePage"

describe("Main Navigation", () => {

  context("desktop", () => {
    beforeEach(() => {
      cy.web3Login()
    })

    it("can navigate to the bin page", () => {
      navigationMenu.binNavButton().click()
      cy.url().should("include", "/bin")
    })

    it("can navigate to the settings page", () => {
      navigationMenu.settingsNavButton().click()
      cy.url().should("include", "/settings")
    })

    // it("can see data storage summary info", () => {
    //   navigationMenu.spaceUsedLabel().should("contain.text", "of 20 GB used")
    //   navigationMenu.spaceUsedProgressBar().should("be.visible")
    // })

    it.skip("can navigate to block survey via send feedback button", () => {
      // TODO: Andrew - find a way to check the button link, cypress doesn't support tabs #1084
    })

    it("can navigate to the home page", () => {
      navigationMenu.homeNavButton().click()
      cy.url().should("include", "/drive")
    })
  })

  context("mobile", () => {
    beforeEach(() => {
      cy.web3Login()
    })

    beforeEach(() => {
      cy.viewport("iphone-6")
      homePage.hamburgerMenuButton().click()
    })

    it("can navigate to the bin page", () => {
      navigationMenu.binNavButton().click()
      cy.url().should("include", "/bin")
    })

    it("can navigate to the settings page", () => {
      navigationMenu.settingsNavButton().click()
      cy.url().should("include", "/settings")
    })

    it("can navigate to the home page", () => {
      navigationMenu.homeNavButton().click()
      cy.url().should("include", "/drive")
    })

    it("can sign out from the navigation bar", () => {
      navigationMenu.signOutButton().click()
      authenticationPage.web3Button().should("be.visible")
      cy.url().should("not.include", "/drive")
      cy.url().should("not.include", "/bin")
      cy.url().should("not.include", "/settings")
    })
  })
})
