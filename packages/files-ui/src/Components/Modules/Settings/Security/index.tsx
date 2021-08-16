import React, { useCallback, useEffect, useMemo, useState } from "react"
import { CloseSvg, Divider, Typography } from "@chainsafe/common-components"
import { makeStyles, createStyles, useThemeSwitcher } from "@chainsafe/common-theme"
import { CSFTheme } from "../../../../Themes/types"
import { t, Trans } from "@lingui/macro"
import { useThresholdKey } from "../../../../Contexts/ThresholdKeyContext"
import clsx from "clsx"
import PasswordForm from "../../../Elements/PasswordForm"
import MnemonicForm from "../../../Elements/MnemonicForm"
import SavedBrowsers from "./SavedBrowsers"

const useStyles = makeStyles(({ constants, breakpoints, palette, typography, zIndex }: CSFTheme) =>
  createStyles({
    root: {
      paddingTop: constants.generalUnit * 2,
      paddingBottom: constants.generalUnit * 3,
      maxWidth: breakpoints.values["md"],
      [breakpoints.down("md")]: {
        padding: constants.generalUnit * 2
      }
    },
    setOption: {
      width: "100%",
      backgroundColor: palette.additional["gray"][4],
      color: palette.additional["gray"][9],
      padding: constants.generalUnit * 1.5,
      borderRadius: 16,
      marginTop: constants.generalUnit * 1.5,
      "& > div": {
        display: "flex",
        alignItems: "center",
        "& > span": {
          display: "block",
          lineHeight: "16px",
          fontWeight: typography.fontWeight.regular,
          "&:first-child": {
            flex: "1 1 0"
          }
        }
      }
    },
    action: {
      display: "flex",
      alignItems: "center"
    },
    icon: {
      width: 21,
      height: 21,
      marginLeft: constants.generalUnit * 1
    },
    buttonLink: {
      outline: "none",
      textDecoration: "underline",
      cursor: "pointer"
    },
    formRoot: {
      position: "relative",
      marginTop: constants.generalUnit * 4,
      marginBottom: constants.generalUnit * 4,
      width: "100%",
      maxWidth: "580px",
      "& p": {
        fontWeight: 400,
        marginBottom: constants.generalUnit * 2
      },
      "& h2": {
        fontWeight: typography.fontWeight.regular,
        marginBottom: constants.generalUnit * 1.5,
        [breakpoints.down("md")]: {
          textAlign: "center"
        }
      },
      "& .passwordFormButton": {
        marginTop: 0,
        marginBottom: constants.generalUnit * 3
      }
    },
    close: {
      position: "absolute",
      cursor: "pointer",
      width: 15,
      height: 15,
      stroke: palette.additional["gray"][9],
      [breakpoints.up("md")]: {
        top: 0,
        right: 0
      },
      [breakpoints.down("md")]: {
        top: constants.generalUnit * 1.5,
        right: constants.generalUnit * 1.5
      }
    },
    input: {
      margin: 0,
      width: "100%",
      marginBottom: constants.generalUnit * 1.5
    },
    inputLabel: {
      fontSize: "16px",
      lineHeight: "24px",
      marginBottom: constants.generalUnit
    },
    button: {
      [breakpoints.up("md")]: {
        marginTop: constants.generalUnit * 10
      },
      [breakpoints.down("md")]: {
        marginTop: constants.generalUnit
      }
    },
    warningMessage: {
      marginTop: constants.generalUnit * 2,
      display: "inline-block",
      marginBottom: constants.generalUnit
    },
    changeButton: {
      marginLeft: "0.5rem"
    },
    divider: {
      zIndex: zIndex?.layer1,
      marginTop: constants.generalUnit * 3
    }
  })
)

interface SecurityProps {
  className?: string
}

const Security = ({ className }: SecurityProps) => {
  const { keyDetails, changePasswordShare, loggedinAs, hasMnemonicShare, browserShares, refreshTKeyMeta } = useThresholdKey()
  const classes = useStyles()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSettingBackupPhrase, setIsSettingBackupPhrase] = useState(false)
  const { desktop } = useThemeSwitcher()
  const showWarning = useMemo(() => !!keyDetails && (keyDetails.threshold === keyDetails.totalShares), [keyDetails])
  const [isRefreshingMetadata, setIsRefreshingMetadata] = useState(false)

  const onResetPasswordForm = useCallback(() => {
    setIsChangingPassword(false)
  }, [])

  const onSetPassword = useCallback((password: string) => {
    return changePasswordShare(password)
      .then(() => setIsChangingPassword(false))
      .catch(console.error)
  }, [changePasswordShare])

  useEffect(() => {
    setIsRefreshingMetadata(true)
    refreshTKeyMeta()
      .catch(console.error)
      .finally(() => setIsRefreshingMetadata(false))
  }, [refreshTKeyMeta])

  return (
    <div className={clsx(classes.root, className)}>
      <div
        id="security"
        data-cy="settings-security-header"
      >
        <Typography
          variant="h4"
          component="h4"
        >
          <Trans>Sign-in methods</Trans>
        </Typography>
        {showWarning && (
          <Typography
            variant="body1"
            className={classes.warningMessage}
          >
            <Trans>
              Hey! You only have two sign-in methods. If you lose that and have only one left,
              you will be locked out of your account forever.
            </Trans>
          </Typography>
        )}
        {
          !!loggedinAs && (
            <section className={classes.setOption}>
              <div>
                <Typography variant="h5">
                  <Trans>
                    Social Sign-in Wallet
                  </Trans>
                </Typography>
                {
                  desktop && (
                    <Typography variant="h5">
                      { loggedinAs }
                    </Typography>
                  )
                }
              </div>
            </section>
          )
        }
        <section className={classes.setOption}>
          <div>
            <Typography variant="h5">
              <Trans>
                Saved Browser
              </Trans>
            </Typography>
            <Typography variant="h5">
              {browserShares.length} <Trans>Saved</Trans>{" "}
            </Typography>
          </div>
        </section>
        {showWarning && (
          <div>
            <Typography
              variant="body1"
              className={classes.warningMessage}
            >
              <Trans>
                Add at least one more authentication method to protect your account.
                You’d only need any two to sign in to Files from any device.
              </Trans>
            </Typography>
          </div>
        )}
        { isChangingPassword
          ? (
            <section className={classes.formRoot}>
              <CloseSvg
                onClick={onResetPasswordForm}
                className={classes.close}
              />
              <Typography
                variant="h4"
                component="h2"
              >
                <Trans>
                  Change password
                </Trans>
              </Typography>
              <PasswordForm
                setPassword={onSetPassword}
                buttonLabel={t`Change Password`}
              />
            </section>
          )
          : (
            <section className={classes.setOption}>
              <div>
                <Typography variant="h5">
                  <Trans>
                    Password
                  </Trans>
                </Typography>
                <Typography variant="h5">
                  {
                    <span
                      className={clsx(classes.action, classes.buttonLink, classes.changeButton)}
                      onClick={() => {setIsChangingPassword(true)}}
                    >
                      <Trans>Change Password</Trans>
                    </span>
                  }
                </Typography>
              </div>
            </section>
          )}
        { isSettingBackupPhrase
          ? (
            <section className={classes.formRoot}>
              <Typography
                variant="h4"
                component="h2"
              >
                <Trans>
                  Generate backup secret phrase
                </Trans>
              </Typography>
              <Typography component="p">
                <Trans>
                  A backup secret phrase will be generated and used for your account.<br/>
                  We do not store it and <b>it can only be displayed once</b>. Save it somewhere safe!
                </Trans>
              </Typography>
              <MnemonicForm
                buttonLabel={t`I’m done saving my backup secret phrase`}
                onComplete={() => setIsSettingBackupPhrase(false)}
              />
            </section>
          )
          : (<section className={classes.setOption}>
            <div>
              <Typography variant="h5">
                <Trans>
                  Backup secret phrase
                </Trans>
              </Typography>
              <Typography variant="h5">
                { !hasMnemonicShare
                  ? (
                    <span className={classes.action}>
                      <span
                        className={classes.buttonLink}
                        onClick={() => {setIsSettingBackupPhrase(true)}}
                      >
                        <Trans>Generate backup secret phrase</Trans>
                      </span>
                    </span>
                  )
                  : (
                    <span className={classes.action}>
                      <Trans>Generated</Trans>
                    </span>
                  )
                }
              </Typography>
            </div>
          </section>)
        }
      </div>
      <Divider className={classes.divider} />
      <SavedBrowsers isRefreshing={isRefreshingMetadata}/>
    </div>
  )
}

export default Security
