--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

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

--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (log_id, user_email, action, table_name, record_id, "timestamp", changes, role, school_id) FROM stdin;
1	gamerbros311@gmail.com	update	students	7	2025-06-05 15:25:01.773482	{"after": {"dew_score": "0.0", "last_name": "Student", "first_name": "Anonymous", "grade_level": "10"}, "before": {"dew_score": "0.0", "last_name": "Student", "first_name": "Anonymous", "grade_level": "10"}}	teacher	1
2	gamerbros311@gmail.com	update	students	7	2025-06-05 15:25:04.747375	{"after": {"dew_score": "0.0", "last_name": "Student", "first_name": "Anonymous", "grade_level": "10"}, "before": {"dew_score": "0.0", "last_name": "Student", "first_name": "Anonymous", "grade_level": "10"}}	teacher	1
3	gamerbros311@gmail.com	update	students	7	2025-06-05 15:25:08.687978	{"after": {"dew_score": "0.0", "last_name": "Student", "first_name": "Anonymous", "grade_level": "10"}, "before": {"dew_score": "0.0", "last_name": "Student", "first_name": "Anonymous", "grade_level": "10"}}	teacher	1
4	gamerbros311@gmail.com	update	students	5	2025-06-05 18:25:07.165302	{"after": {"dew_score": "3.0", "last_name": "Doe", "first_name": "Jane", "grade_level": "10"}, "before": {"dew_score": "3.0", "last_name": "Doe", "first_name": "Jane", "grade_level": "10"}}	school_admin	1
5	daddyhitsmeyouch@gmail.com	update	students	2	2025-06-06 19:01:05.760345	{"after": {"dew_score": "3.0", "last_name": "Doe", "first_name": "Jane", "grade_level": "10"}, "before": {"dew_score": "3.0", "last_name": "Doe", "first_name": "Jane", "grade_level": "10"}}	school_admin	1
6	daddyhitsmeyouch@gmail.com	invite_user	users	tulsi@d.d	2025-06-06 19:05:16.926688	{"after": {"role": "teacher", "email": "tulsi@d.d", "school_id": 1}}	school_admin	1
7	daddyhitsmeyouch@gmail.com	delete_user	users	tulsi@d.d	2025-06-06 19:07:37.987928	{"before": {"role": "teacher", "email": "tulsi@d.d", "school_id": 1}}	school_admin	1
8	daddyhitsmeyouch@gmail.com	add_teacher_note	teacher_notes	1	2025-06-06 20:10:32.230933	{"after": {"note_text": "new note", "student_id": "1", "author_email": "daddyhitsmeyouch@gmail.com"}}	school_admin	1
9	daddyhitsmeyouch@gmail.com	update_student	students	1	2025-06-06 20:10:37.997588	{"after": {"last_name": "Doe", "first_name": "Jane"}, "before": {"last_name": "Doe", "first_name": "Jane"}}	school_admin	1
10	daddyhitsmeyouch@gmail.com	add_teacher_note	teacher_notes	2	2025-06-06 20:10:51.463368	{"after": {"note_text": "note", "student_id": "3", "author_email": "daddyhitsmeyouch@gmail.com"}}	school_admin	1
11	daddyhitsmeyouch@gmail.com	update_student	students	3	2025-06-06 20:10:54.281536	{"after": {"last_name": "Doe", "first_name": "Jane"}, "before": {"last_name": "Doe", "first_name": "Jane"}}	school_admin	1
12	daddyhitsmeyouch@gmail.com	add_teacher_note	teacher_notes	3	2025-06-06 20:11:02.152356	{"after": {"note_text": "qwerqwr", "student_id": "7", "author_email": "daddyhitsmeyouch@gmail.com"}}	school_admin	1
13	daddyhitsmeyouch@gmail.com	update_student	students	7	2025-06-06 20:11:06.327148	{"after": {"last_name": "Student", "first_name": "Anonymous"}, "before": {"last_name": "Student", "first_name": "Anonymous"}}	school_admin	1
14	daddyhitsmeyouch@gmail.com	update_student	students	7	2025-06-06 21:03:28.700425	{"after": {"last_name": "Student", "first_name": "Anonymous"}, "before": {"last_name": "Student", "first_name": "Anonymous"}}	school_admin	1
15	daddyhitsmeyouch@gmail.com	update_document	student_documents	1	2025-06-08 11:30:53.237648	{"after": {"content": "<p>wqeasd</p>"}}	school_admin	1
16	daddyhitsmeyouch@gmail.com	update_document	student_documents	1	2025-06-08 14:46:15.889225	{"after": {"content": "<p>w</p>"}}	school_admin	1
17	devinwbusch@gmail.com	create_school	schools	2	2025-06-08 15:11:10.970163	{"after": {"school_name": "Williamsburg Highschool", "district_name": "Williamsburg"}}	system_admin	\N
\.


--
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domains (domain_id, domain_name) FROM stdin;
1	Risky Behaviors/Low Self-Worth
2	Academic Disengagement
3	Psychological Disengagement
4	Poor School Performance
\.


--
-- Data for Name: risk_factors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.risk_factors (factor_id, factor_name, category) FROM stdin;
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (school_id, school_name, district_name) FROM stdin;
1	Springfield High	Springfield District
2	Williamsburg Highschool	Williamsburg
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (student_id, first_name, last_name, grade_level, support_staff, dew_score, total_score, notes, created_at, updated_at, risk_level, school_id) FROM stdin;
6	Sam	Patel	10	Ms. Ng	3.0	2.156	auto risk test	2025-06-04 14:19:57.368285	2025-06-04 14:19:57.368285	High	1
5	Jane	Doe	10	Ms. Smith	3.0	1.867	Example entry	2025-06-04 14:17:49.270491	2025-06-05 18:25:07.165302	Medium	1
2	Jane	Doe	10	Ms. Smith	3.0	2.222	Example entry	2025-06-04 12:41:55.853316	2025-06-06 19:01:05.760345	High	1
1	Jane	Doe	10		3.0	0.000	notes	2025-06-04 11:56:33.446656	2025-06-06 20:10:37.997588	Low	1
3	Jane	Doe	10		3.0	0.000		2025-06-04 12:42:29.792546	2025-06-06 20:10:54.281536	Low	1
7	Anonymous	Student	10		0.0	0.000		2025-06-05 05:18:20.979831	2025-06-06 21:03:28.700425	Low	1
\.


--
-- Data for Name: student_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_documents (document_id, student_id, content, updated_at) FROM stdin;
1	7	<p>w</p>	2025-06-08 14:46:15.889225
\.


--
-- Data for Name: student_doc_revisions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_doc_revisions (revision_id, document_id, content, author_email, created_at) FROM stdin;
1	1	<p>wqeasd</p>	daddyhitsmeyouch@gmail.com	2025-06-08 11:30:53.237648
2	1	<p>w</p>	daddyhitsmeyouch@gmail.com	2025-06-08 14:46:15.889225
\.


--
-- Data for Name: student_domain_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_domain_scores (id, student_id, domain_id, score) FROM stdin;
77	2	1	2
78	2	2	3
79	2	3	2
80	2	4	2
25	6	1	2
26	6	2	2
27	6	3	1
28	6	4	3
73	5	1	2
74	5	2	3
75	5	3	0
76	5	4	2
\.


--
-- Data for Name: student_risk_factors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_risk_factors (id, student_id, factor_id, severity, notes) FROM stdin;
\.


--
-- Data for Name: supports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supports (support_id, student_id, current_supports, previous_supports, external_supports, notes_from_staff) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, email, role, created_at, school_id) FROM stdin;
1	devinwbusch@gmail.com	system_admin	2025-06-05 02:04:38.240511	\N
9	daddyhitsmeyouch@gmail.com	school_admin	2025-06-05 02:11:28.2394	1
11	buschmachining@gmail.com	student	2025-06-05 02:14:26.042943	1
10	gamerbros311@gmail.com	teacher	2025-06-05 02:11:28.2394	1
\.


--
-- Name: audit_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_log_id_seq', 17, true);


--
-- Name: domains_domain_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domains_domain_id_seq', 16, true);


--
-- Name: risk_factors_factor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.risk_factors_factor_id_seq', 1, false);


--
-- Name: schools_school_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schools_school_id_seq', 2, true);


--
-- Name: student_doc_revisions_revision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_doc_revisions_revision_id_seq', 2, true);


--
-- Name: student_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_documents_document_id_seq', 1, true);


--
-- Name: student_domain_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_domain_scores_id_seq', 80, true);


--
-- Name: student_risk_factors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_risk_factors_id_seq', 1, false);


--
-- Name: students_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_student_id_seq', 7, true);


--
-- Name: supports_support_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supports_support_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 15, true);


--
-- PostgreSQL database dump complete
--

