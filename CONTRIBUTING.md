# Contributors

We welcome contributions to the AZ-204 Exam Study Guide repository! Whether it's fixing typos, adding new resources, or improving existing content, your help is greatly appreciated.

## How to Contribute

1. **Fork the Repository**: Click on the 'Fork' button at the top right of this page.
2. **Clone Your Fork**: Clone your fork to your local machine using `git clone https://github.com/arvigeus/AZ-204.git`.
3. **Create a New Branch**: Create a new branch for your changes using `git checkout -b new-branch-name`.
4. **Make Your Changes**: Make your changes and then commit them using `git commit -m "Description of changes"`.
5. **Push to GitHub**: Push your changes to your fork on GitHub using `git push origin new-branch-name`.
6. **Create a Pull Request**: Go to your fork on GitHub and click the 'New Pull Request' button, and fill out the form.

## Before You Push

The CI pipeline runs automatically on every push and PR. To avoid surprises, run these checks locally first:

```bash
cd modern-quiz-app
npm run lint          # ESLint
npm run type-check    # TypeScript compiler
npm run test          # Unit tests
npm run test -- --coverage  # Tests + coverage report
npm run build         # Production build
```

### CI Pipeline Stages

1. **Lint & Type Check** — ESLint + `tsc --noEmit`
2. **Unit Tests** — Jest with coverage report
3. **Security Audit** — `npm audit`
4. **Build** — Next.js production build (runs after lint + test pass)
5. **API Integration Tests** — Starts the app and curl-tests the sync endpoints
6. **Verify Preview Deployment** — Smoke tests the Vercel preview (PR only)

All stages must pass for a PR to be mergeable.

## Guidelines

- Please ensure that your contributions are relevant to the AZ-204 exam and adhere to the official guidelines.
- **No Exam Dumps Allowed**: Sharing or promoting exam dumps is strictly prohibited. Any contributions containing exam dumps will be rejected.
- **Respect Intellectual Property**: All content must be original. Using questions from proprietary sources is considered intellectual property theft and is strictly prohibited. Any contributions found to be in violation of this will be removed immediately.

## Thank You

A big thank you to all our contributors! Your efforts help make this a valuable resource for everyone preparing for the AZ-204 exam.
