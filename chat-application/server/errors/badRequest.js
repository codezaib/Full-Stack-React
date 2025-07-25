import { StatusCodes } from "http-status-codes";
import CustomError from "./customError.js";
export default class BadRequest extends CustomError {
  constructor(message = "Bad request") {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}
