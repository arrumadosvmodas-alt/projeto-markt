"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCpf = normalizeCpf;
exports.isValidCpf = isValidCpf;
function normalizeCpf(cpf) {
    return cpf.replace(/\D/g, "");
}
function isValidCpf(rawCpf) {
    const cpf = normalizeCpf(rawCpf);
    if (cpf.length !== 11)
        return false;
    if (/^(\d)\1{10}$/.test(cpf))
        return false;
    const digits = cpf.split("").map(Number);
    const calcCheckDigit = (length) => {
        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += digits[i] * (length + 1 - i);
        }
        const rest = (sum * 10) % 11;
        return rest === 10 ? 0 : rest;
    };
    const digit1 = calcCheckDigit(9);
    const digit2 = calcCheckDigit(10);
    return digit1 === digits[9] && digit2 === digits[10];
}
