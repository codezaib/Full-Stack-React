import { StatusCodes } from "http-status-codes";
import CustomError from "./customError.js";

export default class NotFound extends CustomError {
  constructor(message = "Resource not found") {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}
