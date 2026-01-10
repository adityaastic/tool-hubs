import { Router } from "express";
import { 
  ageCalculator, 
  percentageCalculator, 
  averageCalculator, 
  hoursCalculator, 
  creditCardValidator, 
  fakeNameGenerator 
} from "../../controllers/utility.controller.js";

const router = Router();

// Utility calculator endpoints
router.post("/utility/age-calculator", ageCalculator);
router.post("/utility/percentage-calculator", percentageCalculator);
router.post("/utility/average-calculator", averageCalculator);
router.post("/utility/hours-calculator", hoursCalculator);
router.post("/utility/credit-card-validator", creditCardValidator);
router.post("/utility/fake-name-generator", fakeNameGenerator);

export default router;