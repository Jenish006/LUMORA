--
-- PostgreSQL database dump
--

\restrict YqAV3auyhzOAbg5XXINxoGw4EJ3FZNfH5NMl9FN95CgweKQLyktkny97IVtZP6n

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    table_id bigint,
    private_room_id bigint,
    booking_date date NOT NULL,
    booking_time time without time zone NOT NULL,
    guests integer NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    special_request text,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    CONSTRAINT bookings_guests_check CHECK ((guests > 0)),
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'CANCELLED'::character varying, 'COMPLETED'::character varying])::text[]))),
    CONSTRAINT bookings_total_amount_check CHECK ((total_amount >= (0)::numeric))
);



--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    booking_id bigint NOT NULL,
    provider character varying(30) DEFAULT 'RAZORPAY'::character varying NOT NULL,
    provider_order_id character varying(255),
    provider_payment_id character varying(255),
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'FAILED'::character varying, 'REFUNDED'::character varying])::text[])))
);



--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: private_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.private_rooms (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    room_name character varying(100) NOT NULL,
    capacity integer NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT private_rooms_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT private_rooms_price_check CHECK ((price >= (0)::numeric))
);



--
-- Name: private_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.private_rooms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: private_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.private_rooms_id_seq OWNED BY public.private_rooms.id;


--
-- Name: restaurant_hours; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_hours (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    day_of_week smallint NOT NULL,
    open_time time without time zone NOT NULL,
    close_time time without time zone NOT NULL,
    is_closed boolean DEFAULT false NOT NULL,
    CONSTRAINT restaurant_hours_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);



--
-- Name: restaurant_hours_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restaurant_hours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: restaurant_hours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restaurant_hours_id_seq OWNED BY public.restaurant_hours.id;


--
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_tables (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    table_name character varying(50) NOT NULL,
    capacity integer NOT NULL,
    location character varying(50) DEFAULT 'Indoor'::character varying NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT restaurant_tables_capacity_check CHECK ((capacity > 0))
);



--
-- Name: restaurant_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restaurant_tables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: restaurant_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restaurant_tables_id_seq OWNED BY public.restaurant_tables.id;


--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurants (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(150) NOT NULL,
    city character varying(100) NOT NULL,
    cuisine character varying(100) NOT NULL,
    description text,
    rating numeric(2,1) DEFAULT 0,
    price_range character varying(20),
    image_url text,
    address text,
    phone character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- Name: restaurants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restaurants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: restaurants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restaurants_id_seq OWNED BY public.restaurants.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(30) DEFAULT 'CUSTOMER'::character varying NOT NULL,
    phone character varying(20),
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reset_code_hash text,
    reset_code_expires_at timestamp with time zone,
    reset_code_last_sent_at timestamp with time zone,
    reset_code_attempts integer DEFAULT 0 NOT NULL,
    login_failed_attempts integer DEFAULT 0 NOT NULL,
    login_locked_until timestamp with time zone
);



--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: private_rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.private_rooms ALTER COLUMN id SET DEFAULT nextval('public.private_rooms_id_seq'::regclass);


--
-- Name: restaurant_hours id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_hours ALTER COLUMN id SET DEFAULT nextval('public.restaurant_hours_id_seq'::regclass);


--
-- Name: restaurant_tables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_tables ALTER COLUMN id SET DEFAULT nextval('public.restaurant_tables_id_seq'::regclass);


--
-- Name: restaurants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants ALTER COLUMN id SET DEFAULT nextval('public.restaurants_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: payments payments_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_key UNIQUE (booking_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: private_rooms private_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.private_rooms
    ADD CONSTRAINT private_rooms_pkey PRIMARY KEY (id);


--
-- Name: restaurant_hours restaurant_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_hours
    ADD CONSTRAINT restaurant_hours_pkey PRIMARY KEY (id);


--
-- Name: restaurant_hours restaurant_hours_restaurant_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_hours
    ADD CONSTRAINT restaurant_hours_restaurant_id_day_of_week_key UNIQUE (restaurant_id, day_of_week);


--
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_bookings_restaurant_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_restaurant_date ON public.bookings USING btree (restaurant_id, booking_date);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_private_rooms_restaurant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_private_rooms_restaurant_id ON public.private_rooms USING btree (restaurant_id);


--
-- Name: idx_restaurant_hours_restaurant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurant_hours_restaurant_id ON public.restaurant_hours USING btree (restaurant_id);


--
-- Name: idx_restaurant_tables_restaurant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurant_tables_restaurant_id ON public.restaurant_tables USING btree (restaurant_id);


--
-- Name: idx_restaurants_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurants_city ON public.restaurants USING btree (city);


--
-- Name: idx_restaurants_cuisine; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurants_cuisine ON public.restaurants USING btree (cuisine);


--
-- Name: idx_unique_active_room_booking; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_unique_active_room_booking ON public.bookings USING btree (private_room_id, booking_date, booking_time) WHERE ((private_room_id IS NOT NULL) AND ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying])::text[])));


--
-- Name: idx_unique_active_table_booking; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_unique_active_table_booking ON public.bookings USING btree (table_id, booking_date, booking_time) WHERE ((table_id IS NOT NULL) AND ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying])::text[])));


--
-- Name: bookings bookings_private_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_private_room_id_fkey FOREIGN KEY (private_room_id) REFERENCES public.private_rooms(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: private_rooms private_rooms_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.private_rooms
    ADD CONSTRAINT private_rooms_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurant_hours restaurant_hours_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_hours
    ADD CONSTRAINT restaurant_hours_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurant_tables restaurant_tables_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict YqAV3auyhzOAbg5XXINxoGw4EJ3FZNfH5NMl9FN95CgweKQLyktkny97IVtZP6n

