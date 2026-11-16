import crypto from "node:crypto"
import ratelimit from "express-rate-limit"

export const aiLimit = ratelimit({
    windowMs : 60_00,
    max : 10,
    skipFailedRequests : true,
    legacyHeaders : false
})

export function requireApiKey(req, res, next) {
    const provided = req.get("x-api-key") || "";
    const exprected = process.env.OPENROUTER_API_KEY || "";
    const ok = provided && exprected &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(exprected))
    if(!ok) return res.status(401).json({
        status : false,
        message : "Unauthorized"
    })
}

