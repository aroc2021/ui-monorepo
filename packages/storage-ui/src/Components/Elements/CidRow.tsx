import React from "react"
import { makeStyles, createStyles } from "@chainsafe/common-theme"
import { DeleteSvg, formatBytes, MenuDropdown, MoreIcon, TableCell, TableRow  } from "@chainsafe/common-components"
import { Trans } from "@lingui/macro"
import dayjs from "dayjs"
import { PinStatus } from "@chainsafe/files-api-client"
import { CSSTheme } from "../../Themes/types"
import { useStorage } from "../../Contexts/StorageContext"
import { desktopGridSettings, mobileGridSettings } from "../Pages/CidsPage"
import { trimChar } from "../../Utils/pathUtils"

const useStyles = makeStyles(({ animation, constants, breakpoints }: CSSTheme) =>
  createStyles({
    dropdownIcon: {
      "& svg": {
        fill: constants.fileSystemItemRow.dropdownIcon
      }
    },
    dropdownOptions: {
      backgroundColor: constants.fileSystemItemRow.optionsBackground,
      color: constants.fileSystemItemRow.optionsColor,
      border: `1px solid ${constants.fileSystemItemRow.optionsBorder}`
    },
    dropdownItem: {
      backgroundColor: constants.fileSystemItemRow.itemBackground,
      color: constants.fileSystemItemRow.itemColor
    },
    menuIcon: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 20,
      marginRight: constants.generalUnit * 1.5,
      "& svg": {
        fill: constants.fileSystemItemRow.menuIcon
      }
    },
    cid: {
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      "&.editing": {
        overflow: "visible"
      }
    },
    tableRow: {
      border: "2px solid transparent",
      transitionDuration: `${animation.transform}ms`,
      [breakpoints.up("md")]: {
        gridTemplateColumns: desktopGridSettings
      },
      [breakpoints.down("md")]: {
        gridTemplateColumns: mobileGridSettings
      }
    }
  })
)
interface Props {
    pinStatus: PinStatus
}

const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY || ""

const CidRow = ({ pinStatus }: Props) => {
  const classes = useStyles()
  const { unpin } = useStorage()

  return (
    <TableRow
      type="grid"
      className={classes.tableRow}
      data-cy="row-cid-item"
    >
      <TableCell
        className={classes.cid}
        align='left'>
        {pinStatus.pin?.cid}
      </TableCell>
      <TableCell>
        {dayjs(pinStatus.created).format("DD MMM YYYY h:mm a")}
      </TableCell>
      <TableCell>
        {pinStatus.info?.size ? formatBytes(pinStatus.info?.size, 2) : "-"}
      </TableCell>
      <TableCell>
        {pinStatus.status}
      </TableCell>
      <TableCell>
        <a
          href={`${trimChar(IPFS_GATEWAY, "/")}/${pinStatus.pin?.cid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Trans>Open on Gateway</Trans>
        </a>
      </TableCell>
      <TableCell align="right">
        <MenuDropdown
          testId='cid-kebab'
          animation="none"
          anchor={"bottom-right"}
          menuItems={[{
            contents: (
              <>
                <DeleteSvg className={classes.menuIcon} />
                <span data-cy="menu-unpin">
                  <Trans>Unpin</Trans>
                </span>
              </>
            ),
            onClick: () => unpin(pinStatus.requestid)
          }]}
          classNames={{
            icon: classes.dropdownIcon,
            options: classes.dropdownOptions,
            item: classes.dropdownItem
          }}
          indicator={MoreIcon}
        />
      </TableCell>
    </TableRow>
  )
}

export default CidRow