import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

export async function registerRateLimiting(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "15 minutes",
    errorResponseBuilder: () => ({
      error: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
    }),
  });
}

export const authRateLimits = {
  login: {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "15 minutes",
      },
    },
  },
  signup: {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 hour",
      },
    },
  },
  forgotPassword: {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 hour",
      },
    },
  },
  resendVerification: {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 hour",
      },
    },
  },
  refresh: {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: "15 minutes",
      },
    },
  },
  resetPassword: {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 hour",
      },
    },
  },
  verifyEmail: {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 hour",
      },
    },
  },
  changePassword: {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 hour",
      },
    },
  },
} as const;

export const memberRateLimits = {
  applyLoan: {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 hour",
      },
    },
  },
} as const;

export const adminRateLimits = {
  default: {
    config: {
      rateLimit: {
        max: 100,
        timeWindow: "15 minutes",
      },
    },
  },
  mutations: {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: "15 minutes",
      },
    },
  },
} as const;
