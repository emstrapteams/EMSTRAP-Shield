# EMSTRAP-Shield Phase 1 API Documentation

## 1. Scope and status

This document is based on the uploaded `EMSTRAP-Shield.zip` source snapshot and the route/controller declarations in that snapshot. It is not a claim that every endpoint has passed integration testing. Compare it with the current local branch before merging or publishing, because the working tree may have changes not present in the archive.

- Base URL (local): `http://localhost:5000`
- JSON request body: `Content-Type: application/json`
- Success envelope: `{ "success": true, "data": ..., "meta": ...? }`
- Error envelope: `{ "success": false, "message": "...", "errors": [...]? }`
- Pagination: `page` and `limit`; most list endpoints default to page 1 and limit 20, with limit capped at 100. Audit logs use a default limit of 50.
- Create endpoints normally return HTTP 201; successful reads/updates normally return HTTP 200.
- The health endpoint returns `{ success: true, message: "Shield API is running." }`.

## 2. Authentication and company-context contract

Authentication, JWT, RBAC, Super Admin authorization, and final company-isolation enforcement are intentionally external to this branch and must be integrated by the responsible security owner before production use. Do not treat the current placeholder as security.

Business controllers expect `req.companyId` to be supplied by trusted middleware. Company-specific create operations generally overwrite the request body's `company` with `req.companyId`; company-specific reads use that value in the database filter. The temporary `companyContext.js` implementation reads a company identifier from client-controlled request header/query/body and is unsafe for production.

In the uploaded source snapshot, `employeeRoutes.js`, `departmentRoutes.js`, and `facilityRoutes.js` do not mount `setCompanyContext` or another visible company-context middleware. Their controllers therefore see no `req.companyId` unless another layer injects it. In that state, list queries return empty results through a `_blockAll` filter and create operations return HTTP 400. Confirm and coordinate the intended integration with the security owner; this document does not propose modifying auth/security middleware.

`/api/companies` is platform-wide Super Admin CRUD and must be protected by the separately implemented Super Admin authorization layer. `/api/audit-logs` currently has no visible company scoping in its controller and must be restricted by the authorization/integration layer or changed in coordination with the owner.

## 3. Endpoint catalogue

### Health

| Method | Path | Purpose | Inputs |
|---|---|---|---|
| GET | `/api/health` | API health check | None |

### Employees — `/api/employees`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/employees` | List employees | Query: `search`, `department`, `facility`, `status`, `page`, `limit` |
| POST | `/api/employees` | Create employee | JSON: `employeeId`, `name`, `email`, `phone`; optional `department`, `facility`, `designation`, `joiningDate`, `emergencyContact`, `status`. Company is assigned from trusted `req.companyId`. |
| GET | `/api/employees/:id` | Get employee | Path `id` = Mongo ObjectId |
| PUT | `/api/employees/:id` | Update employee | Employee fields; company/history are ignored from body. Route uses the same required-field validator as create, so partial updates may fail validation. |
| PATCH | `/api/employees/:id/status` | Activate/deactivate | JSON `{ "status": "active" | "inactive" }` |
| GET | `/api/employees/:id/history` | Read employee history | Path `id` |

### Departments — `/api/departments`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/departments` | List departments | Query: `search`, `status`, `page`, `limit` |
| POST | `/api/departments` | Create department | JSON: `name`; optional `description`, `status`; company assigned from `req.companyId` |
| GET | `/api/departments/:id` | Get department | Path `id` |
| PUT | `/api/departments/:id` | Update department | Department fields; `company` is ignored |
| PATCH | `/api/departments/:id/status` | Change status | JSON `{ "status": "active" | "inactive" }` |
| GET | `/api/departments/:id/employees` | List department employees | Path `id`; scoped to department/company |

### Facilities — `/api/facilities`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/facilities` | List facilities | Query: `search`, `city`, `status`, `page`, `limit` |
| POST | `/api/facilities` | Create facility | JSON includes `name`; optional address/city/state/country/coordinates/status fields supported by model/validator |
| GET | `/api/facilities/:id` | Get facility | Path `id` |
| PUT | `/api/facilities/:id` | Update facility | Facility fields; `company` is ignored |
| PATCH | `/api/facilities/:id/status` | Change status | JSON `{ "status": "active" | "inactive" }` |

### Equipment — `/api/equipment`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/equipment` | List equipment | Query filters include search/category/type/facility/status and pagination; check controller for exact accepted names |
| POST | `/api/equipment` | Create equipment | Requires `facility`, `category`, `type`, `name`; company assigned from context |
| GET | `/api/equipment/:id` | Get equipment | Path `id` |
| PUT | `/api/equipment/:id` | Update equipment | Equipment fields; company is not editable |
| PATCH | `/api/equipment/:id/status` | Change status | JSON status accepted by Equipment model |
| GET | `/api/equipment/:id/inspections` | Equipment inspection history | Path `id` |

### Fire extinguishers — `/api/fire-extinguishers`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/fire-extinguishers` | List fire extinguishers | Query filters/pagination from equipment controller; records use Equipment model with extinguisher type/category locked by controller |
| POST | `/api/fire-extinguishers` | Create fire extinguisher | Equipment validation; controller fixes type/category |
| GET | `/api/fire-extinguishers/summary` | Summary counts | No body; company context required |
| GET | `/api/fire-extinguishers/:id` | Get extinguisher | Path `id` |
| PUT | `/api/fire-extinguishers/:id` | Update extinguisher | Body fields; type/category locked |
| PATCH | `/api/fire-extinguishers/:id/status` | Change status | Status body |

### First-aid kits — `/api/first-aid-kits`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/first-aid-kits` | List kits | Query filters/pagination from equipment controller |
| POST | `/api/first-aid-kits` | Create kit | Equipment validation; records use Equipment model with type/category fixed |
| GET | `/api/first-aid-kits/:id` | Get kit | Path `id` |
| PUT | `/api/first-aid-kits/:id` | Update kit | Body fields; type/category locked |
| PATCH | `/api/first-aid-kits/:id/status` | Change status | Status body |
| PATCH | `/api/first-aid-kits/:id/contents` | Update kit contents | Contents fields defined by Equipment model/controller |

### Inspections — `/api/inspections`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/inspections` | List inspections | Query: `equipment`, `facility`, `inspector`, `result`, `from`, `to`, `page`, `limit` |
| POST | `/api/inspections` | Create inspection | JSON requires `equipment` and non-empty `checklist`; checklist entries require `item` and valid `result`; updates equipment inspection dates/status |
| GET | `/api/inspections/:id` | Get inspection | Path `id` |
| PUT | `/api/inspections/:id` | Update inspection | Body fields; equipment/company links are immutable in controller |

### Corrective actions — `/api/corrective-actions`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/corrective-actions` | List actions | Query: `search`, `sourceType`, `priority`, `status`, `assignedTo`, `overdue`, `page`, `limit` |
| POST | `/api/corrective-actions` | Create action | JSON requires valid `sourceType` and `title`; optional priority/status/dueDate and other model fields |
| GET | `/api/corrective-actions/:id` | Get action | Path `id` |
| PUT | `/api/corrective-actions/:id` | Update action | Action fields; company ignored |
| PATCH | `/api/corrective-actions/:id/status` | Change status | Valid CorrectiveAction status |
| PATCH | `/api/corrective-actions/:id/evidence` | Append evidence | JSON `evidence` string or array |
| PATCH | `/api/corrective-actions/:id/verify` | Verify action | JSON optional `verificationNotes`; only completed actions can be verified |

### Emergency resources — `/api/emergency-resources`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/emergency-resources` | List resources | Query filters include category/serviceType/status and pagination |
| POST | `/api/emergency-resources` | Create resource | Requires valid `category`, `serviceType`, `name`; category must match service type; priority 1–5 if supplied |
| GET | `/api/emergency-resources/:id` | Get resource | Path `id` |
| PUT | `/api/emergency-resources/:id` | Update resource | Resource fields; company ignored |
| PATCH | `/api/emergency-resources/:id/status` | Change status | `active` or `inactive` |

### Training programs — `/api/training-programs`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/training-programs` | List programs | Query: `search`, `type`, `status`, `page`, `limit` |
| POST | `/api/training-programs` | Create program | Requires `name`, valid `type`; optional requiredSessionsPerYear/status and other model fields |
| GET | `/api/training-programs/:id` | Get program | Path `id` |
| PUT | `/api/training-programs/:id` | Update program | Program fields; company ignored |
| PATCH | `/api/training-programs/:id/status` | Change status | `active` or `inactive` |

### Training sessions — `/api/training-sessions`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/training-sessions` | List sessions | Query: `program`, `facility`, `status`, `from`, `to`, `page`, `limit` |
| POST | `/api/training-sessions` | Create session | Requires `program`, `facility`, valid `scheduledDate`; optional status/time/trainer/notes |
| GET | `/api/training-sessions/:id` | Get session | Path `id` |
| PUT | `/api/training-sessions/:id` | Update session | Session fields; company ignored |
| POST | `/api/training-sessions/:id/assign` | Assign employees | JSON `{ "employeeIds": ["<employee ObjectId>", ...] }`; creates/upserts attendance for employees found in current company |
| GET | `/api/training-sessions/:id/attendance` | List session attendance | Path `id` |

### Training attendance — `/api/training-attendance`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/training-attendance` | List attendance | Query: `employee`, `program`, `session`, `status`, `page`, `limit` |
| PATCH | `/api/training-attendance/:id/status` | Change attendance status | Valid TrainingAttendance status; optional `completedAt` |
| PATCH | `/api/training-attendance/:id/certificates` | Append certificates | JSON `certificates` array or single item |

### Training dashboard — `/api/training-dashboard`

| Method | Path | Purpose | Inputs |
|---|---|---|---|
| GET | `/api/training-dashboard/stats` | Training statistics | Company context required |

### Emergency drills — `/api/drills`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/drills` | List drills | Query: `search`, `facility`, `type`, `status`, `from`, `to`, `page`, `limit` |
| POST | `/api/drills` | Create drill | Requires `facility`, `name`, valid `type`, valid `date`; optional status/scenario/time fields |
| GET | `/api/drills/:id` | Get drill | Path `id` |
| PUT | `/api/drills/:id` | Update drill | Drill fields; company ignored |
| PATCH | `/api/drills/:id/participants` | Replace participant list | JSON `{ "employeeIds": [...] }` |
| PATCH | `/api/drills/:id/attendance` | Record attendance | JSON `{ "employeeId": "...", "attended": true|false, "notes": "..."? }` |
| PATCH | `/api/drills/:id/results` | Record results | Optional `status`, `completionTimeMinutes` |
| POST | `/api/drills/:id/observations` | Add observation | JSON observation text as expected by controller/model |
| POST | `/api/drills/:id/issues` | Add issue | JSON issue description and optional severity |
| PATCH | `/api/drills/:id/corrective-actions` | Link corrective actions | Body contains corrective-action IDs |

### Audit logs — `/api/audit-logs`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/audit-logs` | Search audit logs | Query: `company`, `actorName`, `action`, `resourceType`, `resourceId`, `from`, `to`, `page`, `limit` (default limit 50) |
| GET | `/api/audit-logs/:id` | Get audit log | Path `id` |

**Access warning:** the controller does not itself scope audit-log reads to `req.companyId`; the auth/authorization integration must prevent unauthorized platform-wide or cross-company access.

### Companies — `/api/companies`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/companies` | List companies | Query: `search`, `status`, `page`, `limit` |
| POST | `/api/companies` | Create company | JSON requires `name`, `code`; optional status `active`, `suspended`, or `deactivated` |
| GET | `/api/companies/:id` | Get company | Path `id` |
| GET | `/api/companies/:id/usage` | Company usage counts | Path `id`; counts employees, departments, facilities, equipment |
| PUT | `/api/companies/:id` | Update company | Validator currently requires `name` and `code`, so partial updates may fail |
| PATCH | `/api/companies/:id/status` | Change company status | Valid statuses: `active`, `suspended`, `deactivated` |

**Access warning:** platform-wide operations must be protected by Super Admin authentication/authorization integrated separately.

### Dashboard — `/api/dashboard`

| Method | Path | Purpose | Inputs / notes |
|---|---|---|---|
| GET | `/api/dashboard/overview` | Company safety overview | Query optional `facility`; company context required |

### Reports — `/api/reports`

All report endpoints require company context and accept optional `format` as implemented by `utils/reportService.js` (verify supported formats there before relying on a specific value).

| Method | Path | Purpose | Additional query filters |
|---|---|---|---|
| GET | `/api/reports/equipment` | Equipment report | Equipment filters from report controller |
| GET | `/api/reports/fire-extinguishers` | Fire extinguisher report | Equipment filters from report controller |
| GET | `/api/reports/first-aid-kits` | First-aid kit report | Equipment filters from report controller |
| GET | `/api/reports/inspections` | Inspection report | `facility`, date range as supported by controller |
| GET | `/api/reports/training` | Training report | `program`, `status` |
| GET | `/api/reports/drills` | Drill report | `facility`, `type`, `status` |
| GET | `/api/reports/company-safety-summary` | Aggregated safety summary | `format` |

## 4. Response and error conventions

Typical success:

```json
{ "success": true, "data": { "...": "..." } }
```

Typical paginated success:

```json
{ "success": true, "data": [], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 } }
```

Typical validation error:

```json
{ "success": false, "message": "Validation failed.", "errors": ["field is required."] }
```

The centralized error handler maps Mongoose validation errors to HTTP 400, duplicate-key errors to HTTP 409, invalid ObjectId cast errors to HTTP 400, and missing routes to HTTP 404. Unhandled errors use HTTP 500 unless an error carries a status.

## 5. Known limitations / pending work

1. **Security integration is a blocker:** no authentication/JWT/RBAC implementation is visible in this branch. The temporary company-context placeholder trusts client-supplied company IDs. Replace/integrate only through the designated security owner; do not ship this placeholder to production.
2. **Company context is missing from three route groups in the uploaded snapshot:** employees, departments, facilities. Their controllers require `req.companyId`; verify route wiring with the security owner. Current observed empty list responses may be caused by missing company context, not necessarily empty database collections.
3. **Audit log scope:** audit-log list and detail reads use unscoped queries in the controller. Ensure the auth layer restricts them or coordinate a scoped implementation.
4. **Cross-company references:** several create/update flows accept related ObjectIds. Verify same-company ownership for training program/facility on sessions, drill facility and participant IDs, assigned employee references, and responsible-person links before accepting them.
5. **Update validation:** employee and company PUT routes reuse create validators that require all core fields; decide whether PUT should be full replacement or use PATCH/partial validation.
6. **Runtime validation robustness:** some validators call `.trim()` without checking string type. Non-string values may throw and become HTTP 500 rather than HTTP 400.
7. **Date filters:** several list controllers parse `from`/`to` without rejecting invalid dates; define consistent validation and behavior for invalid/reversed ranges.
8. **Audit writes:** `recordAudit` deliberately swallows write errors, so business requests may succeed without an audit record. Confirm whether this is acceptable for compliance requirements.
9. **No delete endpoints** are exposed for the listed resources. Confirm whether archival/status deactivation is the intended lifecycle policy.
10. **Startup ordering:** `server.js` calls `connectDB()` without awaiting it and begins listening immediately. The DB helper exits on connection failure, but the API may briefly listen before DB readiness. Consider a controlled startup sequence outside the auth/emergency-reporting scope.
11. **DNS workaround:** local Node DNS needed an explicit resolver in the current development environment. Treat that as a local environment workaround and review before deployment.
12. **ZIP hygiene:** the uploaded archive contains environment files and `node_modules`. Do not distribute `.env` files; exclude secrets and generated dependencies from project archives, and rotate any credentials that were exposed.

## 6. Verification record

Tests explicitly reported as run in the live local environment during this conversation:

- `GET /api/health`: successful response reported.
- `GET /api/departments?limit=100`: HTTP/API success, empty data.
- `GET /api/facilities?limit=100`: success reported, response details not captured.
- `GET /api/employees?page=1&limit=10` and `?page=1&limit=5`: success, empty data, pagination metadata present.
- `POST /api/employees` with invalid email and phone: HTTP 400 with both validation errors, passed.
- `GET /api/companies`: success, `total: 0`.
- Backend MongoDB connection: successful after adding a local DNS resolver line at the top of `server.js`.

Not yet tested end-to-end: valid CRUD operations, duplicate-key handling, cross-company access, authorization failures, invalid ObjectIds, report downloads, audit-log authorization, and all other module mutations. Do not describe these as passed until executed.
