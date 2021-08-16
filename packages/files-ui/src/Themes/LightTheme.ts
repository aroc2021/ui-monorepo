import { createTheme } from "@chainsafe/common-theme"
import { CsfColors, UI_CONSTANTS } from "./Constants"

export const lightTheme = createTheme<CsfColors>({
  globalStyling: {
    ":root": {
      "--csf-primary": "#5165DC"
    }
  },
  themeConfig: {
    palette: {
      primary: {
        main: "var(--csf-primary)"
      },
      secondary: {
      }
    },
    constants: {
      ...UI_CONSTANTS,
      ...({
        landing: {
          background: "var(--gray3)",
          border: "var(--gray4)",
          boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
          footerBg: "var(--gray4)",
          footerText: "var(--gray8)"
        },
        loginModule: {
          explainerBg: "var(--gray2)",
          background: "var(--gray2)",
          itemBackground: "var(--gray4)",
          iconColor: "#9E9E9E", // Gray 7.5
          textColor: "var(--gray9)",
          subText: "var(--gray8)",
          flagBg: "var(--gray9)",
          flagText: "var(--gray1)",
          completeBg: "#0C082B", // Gray 9.5
          completeText: "var(--gray3)"
        },
        modalDefault: {
          fadeBackground: "var(--gray9)",
          background: "var(--gray1)"
        },
        header: {
          rootBackground: "var(--gray1)",
          optionsBackground: "var(--gray1)",
          optionsTextColor: "initial",
          optionsBorder: "var(--gray4)",
          menuItemTextColor: "var(--gray8)",
          iconColor: "initial",
          hamburger: "var(--gray10)"
        },
        nav: {
          backgroundColor: "var(--gray3)",
          blocker: "var(--gray9)",
          mobileBackgroundColor: "var(--gray9)",
          headingColor: "inherit",
          itemColor: "inherit",
          itemColorHover: "var(--gray7)",
          itemIconColor: "inherit",
          itemIconColorHover: "var(--gray7)"
        },
        createFolder: {
          backgroundColor: "var(--gray1)",
          color: "var(--gray10)"
        },
        actionModal: {
          backgroundColor: "var(--gray1)",
          color: "var(--gray10)"
        },
        previewModal: {
          controlsBackground: "var(--gray9)",
          controlsColor: "var(--gray8)",
          closeButtonColor: "var(--gray2)",
          fileOpsColor: "var(--gray2)",
          fileNameColor: "var(--gray1)",
          optionsBackground: "var(--gray1)",
          optionsTextColor: "initial",
          optionsBorder: "var(--gray4)",
          menuItemIconColor: "var(--gray7)",
          menuItemTextColor: "var(--gray8)",
          message: "var(--gray6)",
          previewBottomNavHeight: 64,
          previewTopNavHeight: 64
        },
        searchModule:{
          resultsBackground: "var(--gray1)",
          resultsBackdrop: "var(--gray9)",
          resultsHeading: "var(--gray8)",
          resultsFolder: "var(--gray8)",
          resultsRow: "var(--gray8)",
          noResults: "var(--gray7)"
        },
        uploadModal: {
          background: "var(--gray1)",
          color: "var(--gray10)",
          icon: "var(--gray10)",
          iconHover: "var(--gray10)",
          addMore: "var(--gray9)",
          addMoreBackground: "var(--gray3)",
          footerBackground: "var(--gray4)"
        },
        fileInfoModal: {
          background: "var(--gray1)",
          color: "var(--gray10)",
          copyButtonBackground: "var(--gray1)",
          copyButtonColor: "var(--gray10)",
          infoContainerBorderTop: "var(--gray5)"
        },
        moveFileModal: {
          background: "var(--gray1)",
          color: "var(--gray10)"
        },
        filesTable: {
          color: "",
          uploadText: "var(--gray2)",
          gridItemShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)"
        },
        fileSystemItemRow: {
          icon: "var(--gray8)",
          menuIcon: "var(--gray7)",
          dropdownIcon: "initial",
          optionsBackground: "var(--gray1)",
          optionsColor: "initial",
          optionsBorder: "var(--gray4)",
          itemBackground: "initial",
          itemColor: "initial"
        },
        masterKey: {
          desktop: {
            color: "var(--gray10)",
            link: "var(--gray10)",
            checkbox: "var(--gray1)"
          },
          mobile: {
            color: "var(--gray1)",
            link: "var(--gray1)",
            checkbox: "var(--gray9)"
          }
        },
        profile: {
          icon: "initial"
        },
        uploadAlert: {
          icon: "initial"
        },
        settingsPage:{
          darkSwitch: {
            backgroundColor: "var(--gray9)",
            color: "var(--gray5)"
          },
          lightSwitch: {
            backgroundColor: "var(--gray4)",
            color: "var(--gray9)",
            border: "1px solid",
            borderColor: "var(--csf-primary)"
          }
        },
        surveyBanner: {
          color: "var(--gray1)"
        },
        createShareModal: {
          backgroundColor: "var(--gray1)",
          color: "var(--gray10)",
          iconBackingColor: "#EBEEFF"
        }
      } as CsfColors)
    },
    overrides: {
      RadioInput: {
        radio: {
          checked: {
            borderColor: "var(--csf-primary)"
          },
          checkedBefore: {
            backgroundColor: "var(--csf-primary)"
          }
        }
      },
      Typography: {
        h5: {
          fontWeight: 600,
          color: "var(--gray10)"
        }
      },
      TagsInput: {
        option: {
          cursor: "pointer"
        },
        multiValueRemove: {
          cursor: "pointer"
        }
      },
      Button: {
        variants: {
          primary: {
            focus: {
              color: "none",
              backgroundColor: "none",
              "& svg": {
                fill: "none"
              }
            }
          }
        }
      },
      ToggleHiddenText: {
        icon: {
          stroke: "var(--gray9)"
        }
      }
    }
  }
})
