-- AlterTable: add pdfData column (BYTEA) and make url nullable for backward compat
ALTER TABLE "fee_structures" ADD COLUMN "pdfData" BYTEA;
ALTER TABLE "fee_structures" ALTER COLUMN "url" DROP NOT NULL;
