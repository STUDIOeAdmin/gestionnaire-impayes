-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "dateExtract" TIMESTAMP(3),
    "nbAdherents" INTEGER NOT NULL,
    "totalAPayer" DOUBLE PRECISION NOT NULL,
    "totalTropPercu" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adherent" (
    "id" TEXT NOT NULL,
    "numeroDossier" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "famille" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'IMPAYES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adherent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impaye" (
    "id" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "cours" TEXT,
    "totalDu" DOUBLE PRECISION NOT NULL,
    "dontRbst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaye" DOUBLE PRECISION NOT NULL,
    "dontAvoir" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resteAPayer" DOUBLE PRECISION NOT NULL,
    "commentaireInit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Impaye_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Adherent_numeroDossier_key" ON "Adherent"("numeroDossier");

-- CreateIndex
CREATE INDEX "Adherent_nom_idx" ON "Adherent"("nom");

-- CreateIndex
CREATE INDEX "Adherent_statut_idx" ON "Adherent"("statut");

-- CreateIndex
CREATE INDEX "Impaye_adherentId_idx" ON "Impaye"("adherentId");

-- CreateIndex
CREATE INDEX "Impaye_importId_idx" ON "Impaye"("importId");

-- CreateIndex
CREATE INDEX "Contact_adherentId_idx" ON "Contact"("adherentId");

-- CreateIndex
CREATE INDEX "Contact_date_idx" ON "Contact"("date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impaye" ADD CONSTRAINT "Impaye_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "Adherent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impaye" ADD CONSTRAINT "Impaye_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "Adherent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
