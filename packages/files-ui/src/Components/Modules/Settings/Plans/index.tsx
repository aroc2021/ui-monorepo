import React, { useState } from "react"
import { makeStyles, createStyles } from "@chainsafe/common-theme"
import { CSFTheme } from "../../../../Themes/types"
import { plans } from "../../../../Utils/plans"
import PlanBox from "./PlanBox"
import { ArrowLeftIcon, Link, RadioInput, Typography } from "@chainsafe/common-components"
import { Trans } from "@lingui/macro"
import { ROUTE_LINKS } from "../../../FilesRoutes"

const useStyles = makeStyles(({ constants, palette, breakpoints }: CSFTheme) =>
  createStyles({
    container: {
      display: "grid",
      gridColumnGap: constants.generalUnit * 2,
      gridTemplateColumns: "1fr 1fr 1fr"
    },
    heading: {
      marginBottom: constants.generalUnit * 4,
      [breakpoints.down("md")]: {
        marginBottom: constants.generalUnit * 2
      }
    },
    backIcon: {
      fontSize: 10,
      marginRight: constants.generalUnit
    },
    planSettings: {
      display: "flex",
      justifyContent: "space-between",
      margin: `${constants.generalUnit * 2}px 0px ${constants.generalUnit * 5}px`,
      alignItems: "center"
    },
    planRadios: {
      display: "flex",
      alignItems: "center"
    },
    plan1: {
      backgroundColor: palette.additional["gray"][3],
      color: palette.additional["gray"][9]
    },
    plan2: {
      backgroundColor: palette.additional["blue"][7],
      color: palette.additional["gray"][1]
    },
    plan3: {
      backgroundColor: palette.additional["gray"][9],
      color: palette.additional["gray"][1]
    }
  })
)

const Plans = () => {
  const classes = useStyles()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  return (
    <div>
      <Typography
        className={classes.heading}
        variant="h1"
        component="p"
      >
        <Trans>Upgrade your plan</Trans>
      </Typography>
      <div className={classes.planSettings}>
        <Link to={ROUTE_LINKS.SettingsDefault}>
          <ArrowLeftIcon className={classes.backIcon} />
          <Typography>Back to plan settings</Typography>
        </Link>
        <div className={classes.planRadios}>
          <RadioInput
            label="Billed Monthly"
            value="monthly"
            onChange={() => setBillingPeriod("monthly")}
            checked={billingPeriod === "monthly"}
          />
          <RadioInput
            label="Billed Yearly"
            value="yearly"
            onChange={() => setBillingPeriod("yearly")}
            checked={billingPeriod === "yearly"}
          />
        </div>
      </div>
      <div className={classes.container}>
        <PlanBox
          plan={plans[0]}
          rootClass={classes.plan1}
          billingPeriod={billingPeriod}
        />
        <PlanBox
          plan={plans[1]}
          rootClass={classes.plan2}
          billingPeriod={billingPeriod}
        />
        <PlanBox
          plan={plans[2]}
          rootClass={classes.plan3}
          billingPeriod={billingPeriod}
        />
      </div>
    </div>

  )
}

export default Plans