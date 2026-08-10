const MOCK_COMPANIES = ["FPT", "Viettel", "VNPT", "Mobifone", "VNG"] as const;

type MockJobCardSeed = {
    title: string;
    image: string;
    location: string;
    level: string;
    salary: string;
    description: string;
};

type MockJobCard = {
    id: number;
    title: string;
    company_name: string;
    location: string;
    level: string;
    deadline: string;
    quantity: number;
    salary: string;
    direct_contact: string;
    image_url: string;
    description: string;
    requirements: string;
    isMock: true;
    mockDisplayOnly: true;
};

const MOCK_JOB_CARD_SEEDS: MockJobCardSeed[] = [
    { title: "Frontend Developer", image: "/mock-jd/01_frontend_developer.png", location: "Ho Chi Minh City", level: "Junior", salary: "15M - 22M VND", description: "Build polished web interfaces with React and modern UI patterns." },
    { title: "Backend Developer", image: "/mock-jd/02_backend_developer.png", location: "Ha Noi", level: "Middle", salary: "18M - 28M VND", description: "Develop reliable APIs and data services for core business systems." },
    { title: "Full-stack Developer", image: "/mock-jd/03_full_stack_developer.png", location: "Da Nang", level: "Middle", salary: "20M - 30M VND", description: "Own features end to end across frontend, backend, and deployment." },
    { title: "Software Engineer", image: "/mock-jd/04_software_engineer.png", location: "Ho Chi Minh City", level: "Middle", salary: "18M - 32M VND", description: "Ship product features with strong engineering quality and collaboration." },
    { title: "Mobile App Developer", image: "/mock-jd/05_mobile_app_developer.png", location: "Ha Noi", level: "Junior", salary: "16M - 24M VND", description: "Create mobile experiences focused on performance and usability." },
    { title: "DevOps Engineer", image: "/mock-jd/06_devops_engineer.png", location: "Ho Chi Minh City", level: "Senior", salary: "25M - 40M VND", description: "Improve CI/CD, cloud infrastructure, and release reliability." },
    { title: "Cloud Engineer", image: "/mock-jd/07_cloud_engineer.png", location: "Ha Noi", level: "Senior", salary: "25M - 38M VND", description: "Design scalable cloud environments and support platform growth." },
    { title: "Data Analyst", image: "/mock-jd/08_data_analyst.png", location: "Ho Chi Minh City", level: "Junior", salary: "14M - 20M VND", description: "Turn business data into clear dashboards and actionable insights." },
    { title: "Data Engineer", image: "/mock-jd/09_data_engineer.png", location: "Da Nang", level: "Middle", salary: "20M - 32M VND", description: "Build pipelines and clean datasets for analytics and machine learning." },
    { title: "Data Scientist", image: "/mock-jd/10_data_scientist.png", location: "Ha Noi", level: "Senior", salary: "24M - 38M VND", description: "Develop predictive models and experiments to support decisions." },
    { title: "AI Engineer", image: "/mock-jd/11_ai_engineer.png", location: "Ho Chi Minh City", level: "Senior", salary: "28M - 42M VND", description: "Bring AI features into production with practical engineering workflows." },
    { title: "Machine Learning Engineer", image: "/mock-jd/12_machine_learning_engineer.png", location: "Ha Noi", level: "Senior", salary: "28M - 45M VND", description: "Train, optimize, and deploy ML models for real-world products." },
    { title: "Cybersecurity Analyst", image: "/mock-jd/13_cybersecurity_analyst.png", location: "Da Nang", level: "Middle", salary: "18M - 29M VND", description: "Monitor threats, analyze incidents, and improve security posture." },
    { title: "Security Engineer", image: "/mock-jd/14_security_engineer.png", location: "Ho Chi Minh City", level: "Senior", salary: "24M - 36M VND", description: "Embed security best practices across systems and delivery pipelines." },
    { title: "QA Engineer", image: "/mock-jd/15_qa_engineer.png", location: "Ha Noi", level: "Junior", salary: "13M - 20M VND", description: "Ensure product quality through clear test coverage and bug tracking." },
    { title: "UI/UX Designer", image: "/mock-jd/16_ui_ux_designer.png", location: "Ho Chi Minh City", level: "Middle", salary: "16M - 26M VND", description: "Craft intuitive product flows and delightful visual experiences." },
    { title: "System Administrator", image: "/mock-jd/17_system_administrator.png", location: "Ha Noi", level: "Middle", salary: "15M - 24M VND", description: "Maintain stable internal systems, access, and operational tooling." },
    { title: "Network Engineer", image: "/mock-jd/18_network_engineer.png", location: "Da Nang", level: "Middle", salary: "16M - 25M VND", description: "Support secure, resilient networks for growing technical teams." },
    { title: "Database Administrator", image: "/mock-jd/19_database_administrator.png", location: "Ho Chi Minh City", level: "Senior", salary: "22M - 34M VND", description: "Protect and optimize mission-critical databases and backups." },
    { title: "Solutions Architect", image: "/mock-jd/20_solutions_architect.png", location: "Ha Noi", level: "Senior", salary: "30M - 48M VND", description: "Design scalable technical solutions aligned with business goals." },
];

function shuffleCompanies() {
    const pool = [...MOCK_COMPANIES];
    for (let index = pool.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    return pool;
}

export const MOCK_JOB_CARDS: MockJobCard[] = MOCK_JOB_CARD_SEEDS.map((job, index) => {
    const companyPool = shuffleCompanies();
    return {
        id: 9501 + index,
        title: job.title,
        company_name: companyPool[0],
        location: job.location,
        level: job.level,
        deadline: `2026-08-${String((index % 20) + 10).padStart(2, "0")}`,
        quantity: (index % 4) + 1,
        salary: job.salary,
        direct_contact: `talent@${companyPool[0].toLowerCase().replace(/\s+/g, "")}.com`,
        image_url: job.image,
        description: job.description,
        requirements: "Strong communication, teamwork, and role-relevant technical foundation.",
        isMock: true,
        mockDisplayOnly: true,
    };
});
