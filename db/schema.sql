--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.3
-- Dumped by pg_dump version 9.5.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: ChangeLog; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: Climber; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: Club; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "Club" (
    _id character varying(24) NOT NULL,
    name text,
    "shortName" text,
    org_id character varying(24),
    contact_id character varying(24)
);


--
-- Name: Competitor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "Competitor" (
    _id character varying(24) NOT NULL,
    event_id character varying(24),
    climber_id character varying(24),
    category_ids character varying(24)[],
    "createdAt" timestamp without time zone,
    team_ids character varying(24)[],
    number integer
);


--
-- Name: Event; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: Migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "Migration" (
    name text NOT NULL
);


--
-- Name: Org; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "Org" (
    _id character varying(24) NOT NULL,
    name text,
    email text,
    "shortName" text
);


--
-- Name: Result; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: Series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "Series" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    name text,
    date text,
    "teamType_ids" character varying(24)[],
    closed boolean
);


--
-- Name: Team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "Team" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    "teamType_id" character varying(24),
    name text,
    "shortName" text
);


--
-- Name: TeamType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "TeamType" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    name text,
    "default" boolean
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "User" (
    _id character varying(24) NOT NULL,
    name text,
    email text,
    initials text,
    org_id character varying(24),
    role text
);


--
-- Name: UserLogin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "UserLogin" (
    _id character varying(24) NOT NULL,
    "userId" text,
    email text,
    srp jsonb,
    tokens jsonb,
    "resetToken" text,
    "resetTokenExpire" bigint
);


--
-- Name: Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (_id);


--
-- Name: ChangeLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "ChangeLog"
    ADD CONSTRAINT "ChangeLog_pkey" PRIMARY KEY (_id);


--
-- Name: Climber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Climber"
    ADD CONSTRAINT "Climber_pkey" PRIMARY KEY (_id);


--
-- Name: Club_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Club"
    ADD CONSTRAINT "Club_pkey" PRIMARY KEY (_id);


--
-- Name: Competitor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Competitor"
    ADD CONSTRAINT "Competitor_pkey" PRIMARY KEY (_id);


--
-- Name: Event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (_id);


--
-- Name: Migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Migration"
    ADD CONSTRAINT "Migration_pkey" PRIMARY KEY (name);


--
-- Name: Org_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Org"
    ADD CONSTRAINT "Org_pkey" PRIMARY KEY (_id);


--
-- Name: Result_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Result"
    ADD CONSTRAINT "Result_pkey" PRIMARY KEY (_id);


--
-- Name: Series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Series"
    ADD CONSTRAINT "Series_pkey" PRIMARY KEY (_id);


--
-- Name: TeamType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "TeamType"
    ADD CONSTRAINT "TeamType_pkey" PRIMARY KEY (_id);


--
-- Name: Team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (_id);


--
-- Name: UserLogin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "UserLogin"
    ADD CONSTRAINT "UserLogin_pkey" PRIMARY KEY (_id);


--
-- Name: User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (_id);


--
-- Name: ChangeLog_createdAt_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChangeLog_createdAt_parent_id" ON "ChangeLog" USING btree ("createdAt" DESC, parent_id);


--
-- PostgreSQL database dump complete
--

