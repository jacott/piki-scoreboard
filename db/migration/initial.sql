SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;


CREATE TABLE "Category" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    name text,
    "group" text,
    "shortName" text,
    gender text,
    type text,
    "heatFormat" text,
    "minAge" integer,
    "maxAge" integer
);

CREATE TABLE "ChangeLog" (
    _id character varying(24) NOT NULL,
    "createdAt" timestamp without time zone,
    model text,
    model_id character varying(24),
    parent text,
    parent_id character varying(24),
    type text,
    before text,
    after text,
    aux text,
    user_id character varying(24),
    org_id character varying(24)
);

CREATE TABLE "Climber" (
    _id character varying(24) NOT NULL,
    name text,
    org_id character varying(24),
    club_id character varying(24),
    "dateOfBirth" text,
    gender text,
    number integer,
    "uploadId" text,
    disabled boolean,
    team_ids character varying(24)[]
);

CREATE TABLE "Club" (
    _id character varying(24) NOT NULL,
    name text,
    "shortName" text,
    org_id character varying(24),
    contact_id character varying(24)
);

CREATE TABLE "Competitor" (
    _id character varying(24) NOT NULL,
    event_id character varying(24),
    climber_id character varying(24),
    category_ids character varying(24)[],
    "createdAt" timestamp without time zone,
    team_ids character varying(24)[],
    number integer
);

CREATE TABLE "Event" (
    _id character varying(24) NOT NULL,
    name text,
    org_id character varying(24),
    heats jsonb,
    date text,
    errors jsonb,
    closed boolean,
    "teamType_ids" character varying(24)[],
    series_id character varying(24)
);

CREATE TABLE "Org" (
    _id character varying(24) NOT NULL,
    name text,
    email text,
    "shortName" text
);

CREATE TABLE "Result" (
    _id character varying(24) NOT NULL,
    event_id character varying(24),
    climber_id character varying(24),
    category_id character varying(24),
    "time" integer,
    scores jsonb,
    problems jsonb,
    competitor_id character varying(24)
);

CREATE TABLE "Series" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    name text,
    date text,
    "teamType_ids" character varying(24)[],
    closed boolean
);


CREATE TABLE "Team" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    "teamType_id" character varying(24),
    name text,
    "shortName" text
);


CREATE TABLE "TeamType" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    name text,
    "default" boolean
);


CREATE TABLE "User" (
    _id character varying(24) NOT NULL,
    name text,
    email text,
    initials text,
    org_id character varying(24),
    role text
);

CREATE TABLE "UserLogin" (
    _id character varying(24) NOT NULL,
    "userId" text,
    email text,
    srp jsonb,
    tokens jsonb,
    "resetToken" text,
    "resetTokenExpire" bigint
);

ALTER TABLE ONLY "Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "ChangeLog"
    ADD CONSTRAINT "ChangeLog_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Climber"
    ADD CONSTRAINT "Climber_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Club"
    ADD CONSTRAINT "Club_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Competitor"
    ADD CONSTRAINT "Competitor_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Org"
    ADD CONSTRAINT "Org_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Result"
    ADD CONSTRAINT "Result_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Series"
    ADD CONSTRAINT "Series_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "TeamType"
    ADD CONSTRAINT "TeamType_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "UserLogin"
    ADD CONSTRAINT "UserLogin_pkey" PRIMARY KEY (_id);

ALTER TABLE ONLY "User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (_id);

CREATE INDEX "ChangeLog_createdAt_parent_id" ON "ChangeLog" USING btree ("createdAt" DESC, parent_id);
