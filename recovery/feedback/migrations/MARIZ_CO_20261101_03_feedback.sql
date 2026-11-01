-- Additive extension of existing mariz-hq-feedback D1. No original rows/tables rewritten.
CREATE TABLE feedback_company_tickets (
 id TEXT PRIMARY KEY,reference TEXT NOT NULL UNIQUE,
 product TEXT NOT NULL CHECK(product IN ('echoseed','arcade','ground-zero','mariz-co','mariz-pos')),
 kind TEXT NOT NULL CHECK(kind IN ('bug','feature','general')),
 title TEXT NOT NULL,description TEXT NOT NULL,contact TEXT,diagnostics_json TEXT,source_hash TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','triaged','planned','in_development','testing','released','closed','waiting_for_client')),
 priority TEXT NOT NULL DEFAULT 'unassigned' CHECK(priority IN ('unassigned','low','medium','high','critical')),
 assignee TEXT,internal_notes TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 company_id TEXT,author_id TEXT,client_category TEXT CHECK(client_category IS NULL OR client_category IN ('issue','suggestion','complaint','general')),
 client_request_key TEXT,client_request_hash TEXT,
 UNIQUE(author_id,client_request_key)
);
CREATE INDEX feedback_company_company_created ON feedback_company_tickets(company_id,created_at DESC);
CREATE INDEX feedback_company_author_created ON feedback_company_tickets(author_id,created_at DESC);
CREATE INDEX feedback_company_rate_lookup ON feedback_company_tickets(source_hash,created_at);
CREATE INDEX feedback_company_product_status_created ON feedback_company_tickets(product,status,created_at DESC);
CREATE TABLE feedback_company_messages (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT NOT NULL UNIQUE,ticket_id TEXT NOT NULL REFERENCES feedback_company_tickets(id),sender TEXT NOT NULL CHECK(sender IN ('client','admin')),
 author_id TEXT NOT NULL,body TEXT NOT NULL CHECK(length(body) BETWEEN 5 AND 4000),request_key TEXT NOT NULL,requested_status TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(ticket_id,sender,author_id,request_key)
);
CREATE INDEX feedback_company_messages_ticket ON feedback_company_messages(ticket_id,sequence);
