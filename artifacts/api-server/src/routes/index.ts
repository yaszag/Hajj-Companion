import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import groupsRouter from "./groups";
import locationsRouter from "./locations";
import manasikRouter from "./manasik";
import placesRouter from "./places";
import navigationRouter from "./navigation";
import emergencyRouter from "./emergency";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(groupsRouter);
router.use(locationsRouter);
router.use(manasikRouter);
router.use(placesRouter);
router.use(navigationRouter);
router.use(emergencyRouter);
router.use(dashboardRouter);

export default router;
