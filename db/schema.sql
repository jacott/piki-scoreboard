--
-- PostgreSQL database dump
--

-- Dumped from database version 11.5 (Ubuntu 11.5-1)
-- Dumped by pg_dump version 11.5 (Ubuntu 11.5-1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
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

CREATE TABLE public."ChangeLog" (
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

CREATE TABLE public."Climber" (
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
-- Name: ClimberRanking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClimberRanking" (
    climber_id text COLLATE pg_catalog."C",
    event_id text COLLATE pg_catalog."C",
    category_id text COLLATE pg_catalog."C",
    rank integer,
    points integer,
    type character(1)
);


--
-- Name: Club; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Club" (
    _id character varying(24) NOT NULL,
    name text,
    "shortName" text,
    org_id character varying(24),
    contact_id character varying(24)
);


--
-- Name: Competitor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Competitor" (
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

CREATE TABLE public."Event" (
    _id character varying(24) NOT NULL,
    name text,
    org_id character varying(24),
    heats jsonb,
    date text,
    errors jsonb,
    closed boolean,
    "teamType_ids" character varying(24)[],
    series_id character varying(24),
    "ruleVersion" smallint DEFAULT 0
);


--
-- Name: Migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Migration" (
    name text NOT NULL
);


--
-- Name: Org; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Org" (
    _id character varying(24) NOT NULL,
    name text,
    email text,
    "shortName" text
);


--
-- Name: Result; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Result" (
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
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    _id text COLLATE pg_catalog."C" NOT NULL,
    org_id text COLLATE pg_catalog."C",
    user_id text COLLATE pg_catalog."C",
    role text
);


--
-- Name: Series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Series" (
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

CREATE TABLE public."Team" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    "teamType_id" character varying(24),
    name text,
    "shortName" text
);


--
-- Name: TeamType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeamType" (
    _id character varying(24) NOT NULL,
    org_id character varying(24),
    name text,
    "default" boolean
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    _id character varying(24) NOT NULL,
    name text,
    email text,
    initials text
);


--
-- Name: UserLogin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserLogin" (
    _id character varying(24) NOT NULL,
    "userId" text,
    email text,
    password jsonb,
    tokens jsonb,
    "resetToken" text,
    "resetTokenExpire" bigint
);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (_id);


--
-- Name: ChangeLog ChangeLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeLog"
    ADD CONSTRAINT "ChangeLog_pkey" PRIMARY KEY (_id);


--
-- Name: Climber Climber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Climber"
    ADD CONSTRAINT "Climber_pkey" PRIMARY KEY (_id);


--
-- Name: Club Club_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Club"
    ADD CONSTRAINT "Club_pkey" PRIMARY KEY (_id);


--
-- Name: Competitor Competitor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Competitor"
    ADD CONSTRAINT "Competitor_pkey" PRIMARY KEY (_id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (_id);


--
-- Name: Migration Migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Migration"
    ADD CONSTRAINT "Migration_pkey" PRIMARY KEY (name);


--
-- Name: Org Org_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Org"
    ADD CONSTRAINT "Org_pkey" PRIMARY KEY (_id);


--
-- Name: Result Result_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_pkey" PRIMARY KEY (_id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (_id);


--
-- Name: Series Series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Series"
    ADD CONSTRAINT "Series_pkey" PRIMARY KEY (_id);


--
-- Name: TeamType TeamType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamType"
    ADD CONSTRAINT "TeamType_pkey" PRIMARY KEY (_id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (_id);


--
-- Name: UserLogin UserLogin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserLogin"
    ADD CONSTRAINT "UserLogin_pkey" PRIMARY KEY (_id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (_id);


--
-- Name: ChangeLog_createdAt_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChangeLog_createdAt_parent_id" ON public."ChangeLog" USING btree ("createdAt" DESC, parent_id);


--
-- Name: ClimberRanking_event_id_category_id_climber_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClimberRanking_event_id_category_id_climber_id" ON public."ClimberRanking" USING btree (event_id, category_id, climber_id);


--
-- Name: Role_user_id_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_user_id_org_id" ON public."Role" USING btree (user_id, org_id);


--
-- PostgreSQL database dump complete
--

