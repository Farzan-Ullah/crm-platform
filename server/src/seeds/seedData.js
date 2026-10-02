import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Lead } from '../models/Lead.js';
import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { Pipeline } from '../models/Pipeline.js';
import { Deal } from '../models/Deal.js';
import { Setting } from '../models/Setting.js';
import { Session } from '../models/Session.js';
import { AuditLog } from '../models/AuditLog.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { calculateLeadScore } from '../services/leadScoringService.js';
import { ROLES } from '../constants/roles.js';

const seedDatabase = async () => {
  try {
    logger.info('Connecting to MongoDB for seeding...');
    await mongoose.connect(ENV.MONGO_URI);

    logger.info('Clearing old development data...');
    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      Team.deleteMany({}),
      Lead.deleteMany({}),
      Contact.deleteMany({}),
      Company.deleteMany({}),
      Pipeline.deleteMany({}),
      Deal.deleteMany({}),
      Setting.deleteMany({}),
      Session.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // 1. Create Default Tenant
    logger.info('Creating default SaaS tenant...');
    const tenant = await Tenant.create({
      name: 'Acme Enterprise Solutions',
      subdomain: 'acme',
      status: 'active',
      subscription: {
        plan: 'enterprise',
        validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // 2. Create Tenant CRM Settings
    logger.info('Creating tenant settings...');
    await Setting.create({
      tenantId: tenant._id,
      company: {
        name: 'Acme Enterprise Solutions Inc.',
        phone: '+1 (415) 555-0199',
        email: 'sales@acme-corp.com',
        website: 'https://acme-corp.com',
        currency: 'USD',
        timezone: 'America/New_York',
      },
      crm: {
        leadStatuses: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'],
        leadSources: [
          'Website',
          'Referral',
          'Cold Call',
          'Email',
          'Social Media',
          'Advertisement',
          'Campaign',
          'Partner',
          'Other',
        ],
        lostReasons: ['Budget Constraint', 'Competitor Won', 'Timing Issue', 'Feature Gap', 'No Authority'],
      },
    });

    // 3. Create Seed Users
    logger.info('Creating seed users with roles...');
    const defaultPassword = await hashPassword('Password123!');

    const admin = await User.create({
      tenantId: tenant._id,
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'admin@crm.io',
      passwordHash: defaultPassword,
      role: ROLES.ADMIN,
      phone: '+1 (555) 100-0001',
      isActive: true,
    });

    const manager = await User.create({
      tenantId: tenant._id,
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'manager@crm.io',
      passwordHash: defaultPassword,
      role: ROLES.SALES_MANAGER,
      phone: '+1 (555) 100-0002',
      isActive: true,
    });

    const rep1 = await User.create({
      tenantId: tenant._id,
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'rep1@crm.io',
      passwordHash: defaultPassword,
      role: ROLES.SALES_EXECUTIVE,
      phone: '+1 (555) 100-0003',
      isActive: true,
    });

    const rep2 = await User.create({
      tenantId: tenant._id,
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'rep2@crm.io',
      passwordHash: defaultPassword,
      role: ROLES.SALES_EXECUTIVE,
      phone: '+1 (555) 100-0004',
      isActive: true,
    });

    const rep3 = await User.create({
      tenantId: tenant._id,
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'rep3@crm.io',
      passwordHash: defaultPassword,
      role: ROLES.SALES_EXECUTIVE,
      phone: '+1 (555) 100-0005',
      isActive: true,
    });

    const support = await User.create({
      tenantId: tenant._id,
      firstName: 'David',
      lastName: 'Kim',
      email: 'support@crm.io',
      passwordHash: defaultPassword,
      role: ROLES.SUPPORT_AGENT,
      phone: '+1 (555) 100-0006',
      isActive: true,
    });

    // 4. Create Teams
    logger.info('Creating sales teams...');
    const inboundTeam = await Team.create({
      tenantId: tenant._id,
      name: 'Inbound Velocity Team',
      managerId: manager._id,
      memberIds: [rep1._id, rep2._id],
      description: 'Handles digital inbound leads, website trials, and campaign traffic.',
    });

    const outboundTeam = await Team.create({
      tenantId: tenant._id,
      name: 'Strategic Enterprise Outbound',
      managerId: manager._id,
      memberIds: [rep3._id],
      description: 'Proactively targets Fortune 500 strategic cloud migrations.',
    });

    await User.updateMany({ _id: { $in: [rep1._id, rep2._id] } }, { teamId: inboundTeam._id });
    await User.updateOne({ _id: rep3._id }, { teamId: outboundTeam._id });

    // 5. Create Default Sales Pipeline
    logger.info('Creating default sales pipeline with stages...');
    const defaultPipeline = await Pipeline.create({
      tenantId: tenant._id,
      name: 'Direct Enterprise Pipeline',
      isDefault: true,
      stages: [
        { name: 'Discovery', order: 0, probability: 10, color: '#3b82f6', isWon: false, isLost: false },
        { name: 'Demo & Qualification', order: 1, probability: 30, color: '#6366f1', isWon: false, isLost: false },
        { name: 'Proposal Sent', order: 2, probability: 60, color: '#8b5cf6', isWon: false, isLost: false },
        { name: 'Negotiation', order: 3, probability: 80, color: '#f59e0b', isWon: false, isLost: false },
        { name: 'Closed Won', order: 4, probability: 100, color: '#10b981', isWon: true, isLost: false },
        { name: 'Closed Lost', order: 5, probability: 0, color: '#ef4444', isWon: false, isLost: true },
      ],
    });

    // 6. Create Sample Companies
    logger.info('Creating sample enterprise accounts (companies)...');
    const company1 = await Company.create({
      tenantId: tenant._id,
      name: 'Stark Industries Global',
      domain: 'starkindustries.io',
      industry: 'Defense & Aerospace',
      size: '500+',
      website: 'https://starkindustries.io',
      phone: '+1 (212) 555-0130',
      email: 'hq@starkindustries.io',
      address: { street: '10880 Wilshire Blvd', city: 'Los Angeles', state: 'CA', country: 'USA', postalCode: '90024' },
      ownerId: rep1._id,
      tags: ['defense', 'tier-1', 'enterprise'],
      notes: 'Global defense conglomerate exploring cloud pipeline management for avionics division.',
    });

    const company2 = await Company.create({
      tenantId: tenant._id,
      name: 'Wayne Enterprises Tech',
      domain: 'wayneenterprises.com',
      industry: 'Conglomerate',
      size: '500+',
      website: 'https://wayneenterprises.com',
      phone: '+1 (312) 555-0150',
      email: 'contact@wayneenterprises.com',
      address: { street: '1007 Mountain Drive', city: 'Gotham City', state: 'NJ', country: 'USA', postalCode: '07101' },
      ownerId: rep3._id,
      tags: ['manufacturing', 'vip'],
      notes: 'Applied Sciences division evaluating internal CRM systems.',
    });

    const company3 = await Company.create({
      tenantId: tenant._id,
      name: 'Cyberdyne Systems Corp',
      domain: 'cyberdyne.ai',
      industry: 'Artificial Intelligence',
      size: '201-500',
      website: 'https://cyberdyne.ai',
      phone: '+1 (408) 555-0191',
      email: 'info@cyberdyne.ai',
      address: { street: '18144 El Camino Real', city: 'Sunnyvale', state: 'CA', country: 'USA', postalCode: '94086' },
      ownerId: rep2._id,
      tags: ['ai-robotics', 'high-growth'],
    });

    const company4 = await Company.create({
      tenantId: tenant._id,
      name: 'Dunder Mifflin Paper Co',
      domain: 'dundermifflin.com',
      industry: 'Retail & Distribution',
      size: '51-200',
      website: 'https://dundermifflin.com',
      phone: '+1 (570) 555-0100',
      email: 'info@dundermifflin.com',
      address: { street: '1725 Slough Avenue', city: 'Scranton', state: 'PA', country: 'USA', postalCode: '18508' },
      ownerId: rep1._id,
      tags: ['distribution'],
    });

    const company5 = await Company.create({
      tenantId: tenant._id,
      name: 'Initech Software Corp',
      domain: 'initech.com',
      industry: 'Financial Technology',
      size: '51-200',
      website: 'https://initech.com',
      phone: '+1 (512) 555-0120',
      email: 'corp@initech.com',
      address: { street: '4120 Freidrich Lane', city: 'Austin', state: 'TX', country: 'USA', postalCode: '78744' },
      ownerId: rep2._id,
      tags: ['fintech'],
    });

    // 7. Create Sample Contacts
    logger.info('Creating sample business contacts...');
    const seedContacts = await Contact.create([
      {
        tenantId: tenant._id,
        firstName: 'Pepper',
        lastName: 'Potts',
        email: 'ppotts@starkindustries.io',
        phone: '+1 (212) 555-0131',
        jobTitle: 'Chief Executive Officer',
        companyId: company1._id,
        ownerId: rep1._id,
        tags: ['c-suite', 'decision-maker'],
        description: 'Primary decision maker for enterprise SaaS tooling across Stark subsidiaries.',
      },
      {
        tenantId: tenant._id,
        firstName: 'James',
        lastName: 'Rhodes',
        email: 'jrhodes@starkindustries.io',
        phone: '+1 (212) 555-0132',
        jobTitle: 'VP of Military Relations',
        companyId: company1._id,
        ownerId: rep1._id,
        tags: ['procurement'],
      },
      {
        tenantId: tenant._id,
        firstName: 'Lucius',
        lastName: 'Fox',
        email: 'lfox@wayneenterprises.com',
        phone: '+1 (312) 555-0151',
        jobTitle: 'Head of Applied Sciences & CEO',
        companyId: company2._id,
        ownerId: rep3._id,
        tags: ['c-suite', 'key-stakeholder'],
        description: 'Evaluates all technological security and encrypted CRM systems.',
      },
      {
        tenantId: tenant._id,
        firstName: 'Miles',
        lastName: 'Dyson',
        email: 'mdyson@cyberdyne.ai',
        phone: '+1 (408) 555-0192',
        jobTitle: 'Director of Special Projects',
        companyId: company3._id,
        ownerId: rep2._id,
        tags: ['rd-lead'],
      },
      {
        tenantId: tenant._id,
        firstName: 'Dwight',
        lastName: 'Schrute',
        email: 'dschrute@dundermifflin.com',
        phone: '+1 (570) 555-0102',
        jobTitle: 'Assistant to the Regional Director',
        companyId: company4._id,
        ownerId: rep1._id,
        tags: ['sales-lead'],
      },
      {
        tenantId: tenant._id,
        firstName: 'Jim',
        lastName: 'Halpert',
        email: 'jhalpert@dundermifflin.com',
        phone: '+1 (570) 555-0103',
        jobTitle: 'Senior Sales Representative',
        companyId: company4._id,
        ownerId: rep1._id,
      },
      {
        tenantId: tenant._id,
        firstName: 'Peter',
        lastName: 'Gibbons',
        email: 'pgibbons@initech.com',
        phone: '+1 (512) 555-0121',
        jobTitle: 'Systems Architect',
        companyId: company5._id,
        ownerId: rep2._id,
        tags: ['evaluation-team'],
      },
    ]);

    // 8. Create Sample Leads
    logger.info('Creating 20 sample leads with diverse scoring & sources...');
    const rawLeads = [
      {
        firstName: 'Michael',
        lastName: 'Scott',
        email: 'mscott@dundermifflin.com',
        phone: '+1 (570) 555-0101',
        company: 'Dunder Mifflin Paper Co.',
        jobTitle: 'Regional Director',
        source: 'Website',
        status: 'Qualified',
        ownerId: rep1._id,
        tags: ['high-priority', 'paper-industry'],
        notes: 'Requested product demo for 50 licenses. High interest in CRM automation.',
      },
      {
        firstName: 'Rachel',
        lastName: 'Zane',
        email: 'rzane@pearsonhardman.com',
        phone: '+1 (212) 555-0142',
        company: 'Pearson Hardman LLC',
        jobTitle: 'Managing Partner',
        source: 'Referral',
        status: 'Contacted',
        ownerId: rep2._id,
        tags: ['legal', 'vip'],
        notes: 'Referred by senior council. Needs compliance auditing features.',
      },
      {
        firstName: 'Satya',
        lastName: 'Nadella',
        email: 'satya@azurecloudcorp.com',
        phone: '+1 (425) 555-0188',
        company: 'AzureCloud Solutions',
        jobTitle: 'Chief Executive Officer',
        source: 'Website',
        status: 'New',
        ownerId: rep3._id,
        tags: ['enterprise', 'high-priority'],
        notes: 'Inquired via web form about custom private cloud hosting.',
      },
      {
        firstName: 'Sundar',
        lastName: 'Pichai',
        email: 'sundar@alphanext.io',
        phone: '+1 (650) 555-0199',
        company: 'AlphaNext Analytics',
        jobTitle: 'Vice President of Sales',
        source: 'Advertisement',
        status: 'Contacted',
        ownerId: rep1._id,
        tags: ['tech', 'analytics'],
        notes: 'Clicked Google Search ad for sales forecasting.',
      },
      {
        firstName: 'Sheryl',
        lastName: 'Sandberg',
        email: 'sheryl@leaninscale.org',
        phone: '+1 (650) 555-0177',
        company: 'LeanIn Scale Corp',
        jobTitle: 'Chief Operating Officer',
        source: 'Social Media',
        status: 'Qualified',
        ownerId: rep2._id,
        tags: ['executive', 'high-priority'],
        notes: 'Connected via LinkedIn InMail. Follow-up meeting scheduled next Tuesday.',
      },
      {
        firstName: 'Bruce',
        lastName: 'Wayne',
        email: 'bwayne@wayneenterprises.com',
        phone: '+1 (312) 555-0155',
        company: 'Wayne Enterprises Tech',
        jobTitle: 'Owner',
        source: 'Referral',
        status: 'Qualified',
        ownerId: rep3._id,
        tags: ['defense', 'vip', 'high-priority'],
        notes: 'Enterprise quotation required for secure perimeter analytics.',
      },
      {
        firstName: 'Tony',
        lastName: 'Stark',
        email: 'tony@starkindustries.io',
        phone: '+1 (212) 555-0133',
        company: 'Stark Industries Advanced R&D',
        jobTitle: 'Head of Engineering',
        source: 'Website',
        status: 'New',
        ownerId: rep1._id,
        tags: ['robotics', 'high-priority'],
        notes: 'Submitted contact form asking about REST API webhooks capability.',
      },
      {
        firstName: 'Diana',
        lastName: 'Prince',
        email: 'diana@themysciraglobal.org',
        phone: '+1 (202) 555-0144',
        company: 'Themyscira Cultural Arts',
        jobTitle: 'Curator',
        source: 'Partner',
        status: 'Contacted',
        ownerId: rep2._id,
        tags: ['non-profit'],
        notes: 'Partner referral through Museum of Fine Arts.',
      },
      {
        firstName: 'Peter',
        lastName: 'Parker',
        email: 'peter@dailybugle.net',
        phone: '+1 (212) 555-0166',
        company: 'Daily Bugle Media',
        jobTitle: 'Lead Photographer',
        source: 'Cold Call',
        status: 'Unqualified',
        ownerId: rep3._id,
        tags: ['media'],
        notes: 'Budget is currently too small for our professional plan.',
      },
      {
        firstName: 'Logan',
        lastName: 'Howlett',
        email: 'logan@weaponxsystems.ca',
        phone: '+1 (403) 555-0122',
        company: 'WeaponX Systems',
        jobTitle: 'Security Director',
        source: 'Cold Call',
        status: 'Lost',
        ownerId: rep1._id,
        tags: ['security'],
        notes: 'Opted for a legacy on-premise competitor.',
      },
      {
        firstName: 'Arthur',
        lastName: 'Dent',
        email: 'arthur@galaxyguidemedia.co.uk',
        phone: '+44 20 7946 0912',
        company: 'Galaxy Guide Media',
        jobTitle: 'Senior Editor',
        source: 'Email',
        status: 'New',
        ownerId: rep2._id,
        tags: ['publishing'],
        notes: 'Responded to cold newsletter outreach.',
      },
      {
        firstName: 'Clarice',
        lastName: 'Starling',
        email: 'cstarling@quanticoanalytics.gov',
        phone: '+1 (703) 555-0178',
        company: 'Quantico Behavioral Analytics',
        jobTitle: 'Special Agent in Charge',
        source: 'Campaign',
        status: 'Contacted',
        ownerId: rep3._id,
        tags: ['government'],
        notes: 'Attended the Federal GovTech Summit webinar.',
      },
      {
        firstName: 'Dana',
        lastName: 'Scully',
        email: 'dscully@forensicbiotech.org',
        phone: '+1 (202) 555-0189',
        company: 'Forensic BioTech Labs',
        jobTitle: 'Medical Director',
        source: 'Website',
        status: 'Qualified',
        ownerId: rep1._id,
        tags: ['biotech', 'high-priority'],
        notes: 'Needs HIPAA-ready encrypted CRM records.',
      },
      {
        firstName: 'Fox',
        lastName: 'Mulder',
        email: 'fmulder@unexplaineddata.net',
        phone: '+1 (202) 555-0190',
        company: 'Unexplained Phenomena Archive',
        jobTitle: 'Investigator',
        source: 'Other',
        status: 'New',
        ownerId: rep2._id,
        tags: ['investigative'],
        notes: 'Downloaded whitepaper on unstructured text queries.',
      },
      {
        firstName: 'Walter',
        lastName: 'White',
        email: 'walter@albuquerquechem.com',
        phone: '+1 (505) 555-0124',
        company: 'A1A Carwash & Chemical Co.',
        jobTitle: 'Founder',
        source: 'Referral',
        status: 'Qualified',
        ownerId: rep3._id,
        tags: ['manufacturing', 'high-priority'],
        notes: 'Looking for distributor pipeline tracking.',
      },
      {
        firstName: 'Jesse',
        lastName: 'Pinkman',
        email: 'jesse@vamonospest.com',
        phone: '+1 (505) 555-0149',
        company: 'Vamonos Pest Control',
        jobTitle: 'Partner',
        source: 'Social Media',
        status: 'Contacted',
        ownerId: rep1._id,
        tags: ['services'],
        notes: 'Needs mobile appointment scheduling.',
      },
      {
        firstName: 'Saul',
        lastName: 'Goodman',
        email: 'saul@bettercallsaul.law',
        phone: '+1 (505) 555-0199',
        company: 'Goodman & Associates Legal Group',
        jobTitle: 'Managing Attorney',
        source: 'Advertisement',
        status: 'Qualified',
        ownerId: rep2._id,
        tags: ['legal', 'billboard'],
        notes: 'Saw transit billboard and submitted inquiry for high volume lead intake.',
      },
      {
        firstName: 'Kim',
        lastName: 'Wexler',
        email: 'kwexler@schweikartcocy.com',
        phone: '+1 (505) 555-0177',
        company: 'Schweikart & Cokely LLP',
        jobTitle: 'Senior Partner',
        source: 'Website',
        status: 'Qualified',
        ownerId: rep3._id,
        tags: ['finance', 'banking'],
        notes: 'Banking client onboarding workflow required.',
      },
      {
        firstName: 'Gus',
        lastName: 'Fring',
        email: 'gfring@lospolloshermanos.com',
        phone: '+1 (505) 555-0160',
        company: 'Los Pollos Hermanos Franchising',
        jobTitle: 'President',
        source: 'Website',
        status: 'Qualified',
        ownerId: rep1._id,
        tags: ['franchise', 'high-priority'],
        notes: '14 restaurant locations requiring centralized vendor and supplier quotes.',
      },
      {
        firstName: 'Hank',
        lastName: 'Schrader',
        email: 'hschrader@dea-regional.gov',
        phone: '+1 (505) 555-0182',
        company: 'Southwest Mineralogy Guild',
        jobTitle: 'Director',
        source: 'Referral',
        status: 'New',
        ownerId: rep2._id,
        tags: ['non-profit'],
        notes: 'Inquired about non-profit association pricing.',
      },
    ];

    for (const leadData of rawLeads) {
      const { score } = await calculateLeadScore(leadData, tenant._id);
      await Lead.create({
        ...leadData,
        tenantId: tenant._id,
        score,
      });
    }

    // 9. Create Sample Commercial Deals Across Pipeline Stages
    logger.info('Creating sample commercial deals across pipeline stages...');
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const [sDiscovery, sDemo, sProposal, sNegotiation, sWon, sLost] = defaultPipeline.stages;

    await Deal.create([
      {
        tenantId: tenant._id,
        title: 'Stark Industries Avionics Cloud Migration',
        value: 145000,
        pipelineId: defaultPipeline._id,
        stageId: sProposal._id,
        probability: sProposal.probability,
        status: 'Open',
        priority: 'High',
        companyId: company1._id,
        contactId: seedContacts[0]._id,
        ownerId: rep1._id,
        expectedClose: new Date(now + 20 * day),
        source: 'Website',
        tags: ['cloud', 'defense', 'tier-1'],
        description: 'Multi-region enterprise infrastructure deployment across US-East and EU-Central.',
      },
      {
        tenantId: tenant._id,
        title: 'Stark Defense Drone Telemetry Platform',
        value: 85000,
        pipelineId: defaultPipeline._id,
        stageId: sDemo._id,
        probability: sDemo.probability,
        status: 'Open',
        priority: 'Medium',
        companyId: company1._id,
        contactId: seedContacts[1]._id,
        ownerId: rep1._id,
        expectedClose: new Date(now + 45 * day),
        source: 'Referral',
        tags: ['telemetry', 'hardware'],
      },
      {
        tenantId: tenant._id,
        title: 'Wayne Enterprises Perimeter Defense Grid',
        value: 320000,
        pipelineId: defaultPipeline._id,
        stageId: sNegotiation._id,
        probability: sNegotiation.probability,
        status: 'Open',
        priority: 'High',
        companyId: company2._id,
        contactId: seedContacts[2]._id,
        ownerId: rep3._id,
        expectedClose: new Date(now + 10 * day),
        source: 'Outbound',
        tags: ['perimeter', 'encrypted', 'high-value'],
        description: 'Applied Sciences secure server deployment with zero-trust architecture.',
      },
      {
        tenantId: tenant._id,
        title: 'Wayne Bio-Medical R&D Data Sync',
        value: 90000,
        pipelineId: defaultPipeline._id,
        stageId: sDiscovery._id,
        probability: sDiscovery.probability,
        status: 'Open',
        priority: 'Low',
        companyId: company2._id,
        contactId: seedContacts[2]._id,
        ownerId: rep3._id,
        expectedClose: new Date(now + 75 * day),
        source: 'Referral',
        tags: ['bio-tech', 'rnd'],
      },
      {
        tenantId: tenant._id,
        title: 'Cyberdyne Neural Network Observability',
        value: 210000,
        pipelineId: defaultPipeline._id,
        stageId: sWon._id,
        probability: 100,
        status: 'Won',
        priority: 'High',
        companyId: company3._id,
        contactId: seedContacts[3]._id,
        ownerId: rep2._id,
        expectedClose: new Date(now - 14 * day),
        source: 'Website',
        tags: ['ai', 'neural-net', 'won'],
        description: 'Multi-year contract executed for neural cluster metric pipelines.',
      },
      {
        tenantId: tenant._id,
        title: 'Cyberdyne Distributed Compute Cluster',
        value: 175000,
        pipelineId: defaultPipeline._id,
        stageId: sProposal._id,
        probability: sProposal.probability,
        status: 'Open',
        priority: 'High',
        companyId: company3._id,
        contactId: seedContacts[3]._id,
        ownerId: rep2._id,
        expectedClose: new Date(now + 30 * day),
        source: 'Conference',
        tags: ['hpc', 'gpu-cluster'],
      },
      {
        tenantId: tenant._id,
        title: 'Dunder Mifflin Scranton Regional ERP Rollout',
        value: 65000,
        pipelineId: defaultPipeline._id,
        stageId: sNegotiation._id,
        probability: sNegotiation.probability,
        status: 'Open',
        priority: 'Medium',
        companyId: company4._id,
        contactId: seedContacts[4]._id,
        ownerId: rep1._id,
        expectedClose: new Date(now + 15 * day),
        source: 'Website',
        tags: ['distribution', 'erp'],
      },
      {
        tenantId: tenant._id,
        title: 'Dunder Mifflin Direct Mail Automation Tool',
        value: 30000,
        pipelineId: defaultPipeline._id,
        stageId: sDiscovery._id,
        probability: sDiscovery.probability,
        status: 'Open',
        priority: 'Low',
        companyId: company4._id,
        contactId: seedContacts[5]._id,
        ownerId: rep1._id,
        expectedClose: new Date(now + 60 * day),
        source: 'Outbound',
        tags: ['marketing', 'print'],
      },
      {
        tenantId: tenant._id,
        title: 'Initech Core Banking Microservices Architecture',
        value: 195000,
        pipelineId: defaultPipeline._id,
        stageId: sDemo._id,
        probability: sDemo.probability,
        status: 'Open',
        priority: 'High',
        companyId: company5._id,
        contactId: seedContacts[6]._id,
        ownerId: rep2._id,
        expectedClose: new Date(now + 40 * day),
        source: 'Inbound Web',
        tags: ['fintech', 'microservices'],
      },
      {
        tenantId: tenant._id,
        title: 'Initech TPS Automated Reporting Engine',
        value: 40000,
        pipelineId: defaultPipeline._id,
        stageId: sLost._id,
        probability: 0,
        status: 'Lost',
        priority: 'Low',
        companyId: company5._id,
        contactId: seedContacts[6]._id,
        ownerId: rep2._id,
        expectedClose: new Date(now - 10 * day),
        lostReason: 'Budget Constraints / Price Too High: Management decided to maintain existing spreadsheet reports.',
        source: 'Referral',
        tags: ['reporting', 'lost'],
      },
      {
        tenantId: tenant._id,
        title: 'AeroPrecision Titanium Sourcing Contract',
        value: 380000,
        pipelineId: defaultPipeline._id,
        stageId: sWon._id,
        probability: 100,
        status: 'Won',
        priority: 'High',
        companyId: company1._id,
        ownerId: rep1._id,
        expectedClose: new Date(now - 3 * day),
        source: 'Partner',
        tags: ['defense', 'materials', 'won'],
      },
      {
        tenantId: tenant._id,
        title: 'OmniCorp Automated Supply Chain Integration',
        value: 125000,
        pipelineId: defaultPipeline._id,
        stageId: sDiscovery._id,
        probability: sDiscovery.probability,
        status: 'Open',
        priority: 'Medium',
        companyId: company2._id,
        ownerId: rep3._id,
        expectedClose: new Date(now + 90 * day),
        source: 'Advertisement',
        tags: ['supply-chain'],
      },
    ]);

    logger.info('===========================================================');
    logger.info('  PHASE 4 SEEDING COMPLETED SUCCESSFULLY');
    logger.info(`  Tenant: ${tenant.name} (${tenant.subdomain})`);
    logger.info(`  Users: 6 accounts seeded (Admin, Manager, 3 Reps, Support)`);
    logger.info(`  Teams: 2 teams seeded (Inbound & Outbound)`);
    logger.info(`  Leads: 20 leads seeded with real scores`);
    logger.info(`  Companies: 5 enterprise accounts seeded`);
    logger.info(`  Contacts: 7 key stakeholders seeded`);
    logger.info(`  Pipeline: Direct Enterprise Pipeline (6 stages)`);
    logger.info(`  Deals: 12 commercial opportunities seeded ($1.8M+ pipeline)`);
    logger.info('===========================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed error: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

seedDatabase();
