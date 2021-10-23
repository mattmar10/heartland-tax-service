"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdaHandler = void 0;
const AWS = __importStar(require("aws-sdk"));
const taxjar_1 = __importDefault(require("taxjar"));
const parseIncomingRequest = (event) => {
    try {
        const taxRequest = JSON.parse(event.body);
        const toAddress = {
            city: taxRequest.toAddress.city,
            state: taxRequest.toAddress.state,
            zipCode: taxRequest.toAddress.zipCode,
            street: taxRequest.toAddress.street,
            country: taxRequest.toAddress.country,
        };
        const fromAddress = {
            city: taxRequest.fromAddress.city,
            state: taxRequest.fromAddress.state,
            zipCode: taxRequest.fromAddress.zipCode,
            street: taxRequest.fromAddress.street,
            country: taxRequest.fromAddress.country,
        };
        const incTaxRequest = {
            toAddress: toAddress,
            fromAddres: fromAddress,
            subtotal: taxRequest.subtotal,
            shippingCost: taxRequest.shippingCost,
        };
        return incTaxRequest;
    }
    catch (err) {
        console.error("unable to parse incoming event");
        //gross... but easiest approach to adhere to the shape of the error type being thrown by tax jar.
        //This is why we have eithers.
        throw {
            detail: "unable to parse incoming event",
            status: 400,
        };
    }
};
const getParameterFromSSM = async (name, decrypt) => {
    const ssm = new AWS.SSM({ region: "us-east-1" });
    const result = await ssm
        .getParameter({ Name: name, WithDecryption: decrypt })
        .promise();
    return result.Parameter.Value;
};
const buildTaxParams = (incTaxRequest) => {
    return {
        from_country: incTaxRequest.fromAddres.country,
        from_zip: incTaxRequest.fromAddres.zipCode,
        from_state: incTaxRequest.fromAddres.state,
        from_city: incTaxRequest.fromAddres.city,
        from_street: incTaxRequest.fromAddres.street,
        to_country: incTaxRequest.toAddress.country,
        to_zip: incTaxRequest.toAddress.zipCode,
        to_state: incTaxRequest.toAddress.state,
        to_city: incTaxRequest.toAddress.city,
        to_street: incTaxRequest.toAddress.street,
        amount: incTaxRequest.subtotal,
        shipping: incTaxRequest.shippingCost,
    };
};
const lambdaHandler = async (event) => {
    const taxJarKey = await getParameterFromSSM("TAX_JAR_API_KEY_SB", true);
    console.log(`key ${taxJarKey}`);
    const taxJarClient = new taxjar_1.default({
        apiKey: taxJarKey,
    });
    try {
        const incTaxRequest = parseIncomingRequest(event);
        const taxParams = buildTaxParams(incTaxRequest);
        const result = await taxJarClient.taxForOrder(taxParams);
        const response = {
            amountToCollect: result.tax.amount_to_collect,
            rate: result.tax.rate,
            fromAddress: incTaxRequest.fromAddres,
            toAddress: incTaxRequest.toAddress,
        };
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
        };
    }
    catch (err) {
        const errorMsg = `error fetching taxes: ${err.detail}`;
        console.error(errorMsg);
        return {
            statusCode: err.status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: errorMsg }),
        };
    }
};
exports.lambdaHandler = lambdaHandler;
//# sourceMappingURL=app.js.map