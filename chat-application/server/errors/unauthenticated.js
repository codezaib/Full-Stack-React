import CustomError from "./customError.js";
import { StatusCodes } from "http-status-codes";
export default class UnAuthenticatedError extends CustomError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}
