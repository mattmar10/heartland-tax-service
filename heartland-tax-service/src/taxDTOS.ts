export interface TaxResponse {
    amountToCollect: number;
    rate: number;
    fromAddress: AddressDTO;
    toAddress: AddressDTO;
}

export interface AddressDTO {
    city: string;
    state: string;
    zipCode: string;
    street: string;
    country: "US";
}

export interface IncomingTaxRequest {
    toAddress: AddressDTO;
    fromAddres: AddressDTO;
    subtotal: number;
    shippingCost: number;
}
