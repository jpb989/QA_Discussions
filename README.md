# QA Discussions

A real-time Question & Answer platform built with **Next.js**, **FastAPI**, and **MySQL**

## Features
- **Real-time Updates**: WebSockets ensure questions and answers appear instantly without refreshing.
- **Authentication**: JWT-based secure Login and Signup.
- **Admin Capabilities**:
    - Delete questions and answers.
    - Promote/Revoke Admin status for other users.
    - Mark questions as "Answered".
- **Responsive Design**: Clean, modern UI using Tailwind CSS and Lucide icons.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **Database**: MySQL 8.0
- **Infrastructure**: Docker Compose, GitHub Actions (CI)

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Running Locally
1.  Clone the repo.
2.  Create a `.env` file in the root with the following environment variables:
    ```
    MYSQL_ROOT_PASSWORD=your_mysql_root_password
    MYSQL_DATABASE=your_mysql_database
    MYSQL_USER=your_mysql_user
    MYSQL_PASSWORD=your_mysql_password
    SECRET_KEY=your_secret_key_for_jwt
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```
    You can use the values above as defaults for development, or customize them as needed.
3.  Run:
    ```bash
    docker-compose up --build
    ```
4.  Open [http://localhost:3000](http://localhost:3000).

### CI/CD
The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Verifies Frontend compilation (`npm run build`).
- Checks Docker image builds.
- Uses GitHub Secrets for sensitive environment variables (`MYSQL_PASSWORD`, etc.).
