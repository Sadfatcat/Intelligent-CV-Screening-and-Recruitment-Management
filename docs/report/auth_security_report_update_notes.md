# Auth and Security Report Update Notes

## Current Context

The application originally had separate login entry points for different roles:

- Candidate login through `/login`
- Recruiter login through `/recruiter/login`
- Admin login through `/admin/login`

The implementation has now been adjusted in phase 1 so that `/login` is the primary unified login page. Users enter the same login form, and the frontend redirects them based on the role returned by the backend.

## Phase 1 Implemented Changes

The unified login flow keeps the existing backend `/api/auth/login` endpoint.

After login, the backend returns the user role, and the frontend redirects:

- `admin` -> `/admin/dashboard`
- `recruiter` -> `/recruiter_UI`
- `recruiter` with default password -> `/recruiter/change-password`
- `candidate` -> `/candidate_UI`

The old routes `/admin/login` and `/recruiter/login` now redirect to `/login`, so old links do not break.

The login page UI was restyled to match the previous recruiter login design, but the login behavior is now role-based and unified.

## Why This Affects The Report

If the report currently describes separate login pages for each user type, it should be updated.

The correct description is now:

> The system provides a unified login page. After authentication, the backend returns the authenticated user's role. The frontend uses this role to route the user to the appropriate workspace: admin dashboard, recruiter workspace, or candidate dashboard.

## Security Implication Of Phase 1

Phase 1 improves user experience but does not fully harden backend security.

Important point for the report:

> Frontend redirection based on role is mainly a user experience mechanism. Real security should be enforced by backend authorization checks on protected API routes.

The current system still has some API calls that pass IDs such as `admin_id`, `recruiter_id`, or `candidate_id` in request paths, query parameters, or request bodies. This is acceptable for a controlled demo or academic prototype, but it is not ideal for production security because IDs can be modified by a malicious user.

## Phase 2 Security Plan

Phase 2 should introduce token-based authentication and backend role guards.

Recommended design:

1. When login succeeds, backend returns an access token.
2. The token contains:
   - `user_id`
   - `role`
   - `email`
   - expiration time
3. Frontend sends the token with protected API requests:

```http
Authorization: Bearer <access_token>
```

4. Backend verifies the token on protected routes.
5. Backend derives the current user from the token instead of trusting user IDs supplied by the frontend.
6. Backend checks role before allowing access:
   - Admin APIs require `role = admin`
   - Recruiter APIs require `role = recruiter`
   - Candidate APIs require `role = candidate`

## Report Text Suggested For Phase 2

Suggested paragraph:

> To strengthen authentication and authorization, the system can be extended with JWT-based access tokens. After a successful login, the backend issues a signed token containing the user's ID, role, email, and expiration time. Protected API routes verify this token before processing requests. This ensures that role-based access control is enforced on the backend, not only through frontend route redirection.

Suggested paragraph about limitations:

> In the current prototype, some API requests still pass user identifiers such as `admin_id`, `recruiter_id`, or `candidate_id` from the frontend. While this is sufficient for demonstration, a production-ready system should derive the current user from the verified authentication token and reject requests that attempt to access resources outside the user's role or ownership scope.

## LocalStorage vs HttpOnly Cookie

If the implementation stores tokens in `localStorage`, mention this limitation:

> Storing tokens in `localStorage` is simple for a frontend prototype but can be vulnerable to XSS attacks. A more secure production approach is to store session tokens in HttpOnly secure cookies, which cannot be accessed directly by JavaScript.

## Recommendation For This Project

Recommended report position:

- Present phase 1 unified login as the implemented feature.
- Present JWT/backend role guards as a security enhancement or future improvement unless fully implemented and tested.

This avoids overstating the current security level while still showing that the project has a clear path toward production-grade authentication.

