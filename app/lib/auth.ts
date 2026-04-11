import { betterAuth } from "better-auth";
import { MssqlDialect } from "kysely";
import * as Tedious from "tedious";
import * as Tarn from "tarn";
import { nextCookies } from "better-auth/next-js";

const dialect = new MssqlDialect({
  tarn: {
    ...Tarn,
    options: { min: 0, max: 10 },
  },
  tedious: {
    ...Tedious,
    connectionFactory: () =>
      new Tedious.Connection({
        authentication: {
          options: {
            password: process.env.MSSQL_PASSWORD!,
            userName: process.env.MSSQL_USER!,
          },
          type: "default",
        },
        options: {
          database: process.env.MSSQL_DATABASE!,
          port: parseInt(process.env.MSSQL_PORT || "1433"),
          trustServerCertificate: process.env.NODE_ENV === "development",
          encrypt: true,
        },
        server: process.env.MSSQL_SERVER!,
      }),
  },
});

export const auth = betterAuth({
  database: {
    dialect,
    type: "mssql",
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://cardly-tau-tawny.vercel.app",
    ...(process.env.VERCEL_URL
      ? [`https://${process.env.VERCEL_URL}`]
      : []),
  ],
  plugins: [nextCookies()],
});
