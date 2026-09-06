---
layout: case-study.njk
title: "Multi-Client SaaS Monitoring Platform"
description: "A Terraform-based GCP Cloud Monitoring platform where onboarding a new enterprise client is a config change, not new code."
role: "Sole engineer"
duration: "Q4 2025 — ongoing"
tags: ["Terraform", "GCP", "Cloud Monitoring", "Pub/Sub", "Redis", "Slack"]
permalink: /work/monitoring-platform/
---
## The situation

Monitoring for enterprise SaaS clients on GCP — databases, caches, messaging, GKE, load balancers —
was set up ad hoc, per project, with no shared codebase. Every new client meant rebuilding alerting
and notification channels from scratch, with no consistent way for the central SRE team to see
across all of them while keeping each client's own visibility scoped to themselves.

## What I did

I designed and built the full Terraform codebase end to end, with architectural input from my lead
along the way. It's built around a primary/secondary deployment pattern: one deployment per GCP
project creates the shared, global SRE notification channels (email and Slack), and any number of
secondary deployments import those channels and add only their own client-specific ones. I built out
9 service modules — Cloud SQL, Redis, Pub/Sub, GKE, Load Balancer, Uptime, custom log-based alerts,
log-metric alerts, and notification channels — and added priority-based (P0-P3) routing so severity
determines where an alert goes. I also took the codebase through a full refactor, from an initial
working version through several iterations, to strip out client-specific hardcoded values and make
every module genuinely reusable.

## Architecture

Exactly one deployment per GCP project is marked primary and owns the shared SRE-wide notification
channels. Every other (secondary) deployment in that project imports those shared channels via data
sources instead of recreating them, and layers on only its own client-specific channels. Each of the
9 modules follows the same rule: every alert always reaches the global SRE channels, and is
additionally routed to the client's own channels based on priority.

Onboarding a new client is a `.tfvars` file, not new module code.

## Impact

A single Terraform codebase now backs monitoring for three enterprise clients, with one fully live
in production and the others configured and ready to roll out. Adding monitoring for a new client no
longer requires new engineering work — just a configuration file. PagerDuty integration for incident
escalation is planned as the next step.

## Tech stack

Terraform · GCP Cloud Monitoring · Cloud SQL · Memorystore for Redis · Pub/Sub · GKE · HTTP(S) Load
Balancing · Slack
