import { HiAnimeError } from "aniwatch";
const errResp = {
    status: 500,
    message: "Internal Server Error",
};
export const errorHandler = (err, c) => {
    console.error(err);
    if (err instanceof HiAnimeError) {
        errResp.status = err.status;
        errResp.message = err.message;
    }
    return c.json(errResp, errResp.status);
};
export const notFoundHandler = (c) => {
    errResp.status = 404;
    errResp.message = "Not Found";
    console.error(errResp);
    return c.json(errResp, errResp.status);
};
//# sourceMappingURL=errorHandler.js.map