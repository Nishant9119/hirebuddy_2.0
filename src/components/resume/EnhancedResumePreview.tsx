import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink } from 'lucide-react';

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    school: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa: string;
    honors: string;
    coursework: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    frameworks: string[];
  };
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link: string;
    github: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate: string;
    credentialId: string;
    link: string;
  }>;
  languages: Array<{
    id: string;
    language: string;
    proficiency: string;
  }>;
  volunteer: Array<{
    id: string;
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  awards: Array<{
    id: string;
    title: string;
    issuer: string;
    date: string;
    description: string;
  }>;
}

interface Settings {
  template: string;
  fontSize: number;
  fontFamily: string;
  colorScheme: string;
  spacing: string;
  showPhoto: boolean;
  sectionOrder: string[];
  enabledSections: Record<string, boolean>;
  margins?: string;
  headerStyle?: string;
  showDividers?: boolean;
  bulletStyle?: string;
  sectionSpacing?: number;
  textAlign?: string;
}

interface EnhancedResumePreviewProps {
  data: ResumeData;
  settings: Settings;
}

const colorSchemes = {
  blue: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#dbeafe',
    text: '#1e40af'
  },
  green: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#d1fae5',
    text: '#047857'
  },
  purple: {
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#ede9fe',
    text: '#6d28d9'
  },
  red: {
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#fee2e2',
    text: '#b91c1c'
  },
  orange: {
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fed7aa',
    text: '#c2410c'
  },
  teal: {
    primary: '#0d9488',
    secondary: '#14b8a6',
    accent: '#ccfbf1',
    text: '#0f766e'
  },
  pink: {
    primary: '#db2777',
    secondary: '#ec4899',
    accent: '#fce7f3',
    text: '#be185d'
  },
  indigo: {
    primary: '#4f46e5',
    secondary: '#6366f1',
    accent: '#e0e7ff',
    text: '#4338ca'
  }
};

export const EnhancedResumePreview: React.FC<EnhancedResumePreviewProps> = ({ 
  data, 
  settings 
}) => {
  const colors = colorSchemes[settings.colorScheme as keyof typeof colorSchemes] || colorSchemes.blue;
  
  // Get font family CSS value
  const getFontFamily = () => {
    switch (settings.fontFamily) {
      case 'Inter':
        return 'Inter, sans-serif';
      case 'Roboto':
        return 'Roboto, sans-serif';
      case 'Open Sans':
        return '"Open Sans", sans-serif';
      case 'Lato':
        return 'Lato, sans-serif';
      case 'Arial':
        return 'Arial, sans-serif';
      case 'Times New Roman':
        return '"Times New Roman", serif';
      case 'Georgia':
        return 'Georgia, serif';
      default:
        return 'Times New Roman, serif';
    }
  };

  // Get line height based on spacing
  const getLineHeight = () => {
    switch (settings.spacing) {
      case 'compact':
        return 1.3;
      case 'normal':
        return 1.4;
      case 'relaxed':
        return 1.6;
      default:
        return 1.4;
    }
  };

  // Get margins based on settings
  const getMargins = () => {
    switch (settings.margins) {
      case 'narrow':
        return '12mm';
      case 'normal':
        return '15mm';
      case 'wide':
        return '20mm';
      default:
        return '15mm';
    }
  };

  // Get header layout based on header style
  const getHeaderLayout = () => {
    switch (settings.headerStyle) {
      case 'centered':
        return 'text-center';
      case 'modern':
        return 'flex justify-between items-start';
      case 'split-balanced':
        return 'grid grid-cols-2 gap-4 items-start';
      case 'split-contact-right':
        return 'flex justify-between items-start';
      case 'split-contact-left':
        return 'flex flex-row-reverse justify-between items-start';
      case 'minimalist':
        return 'space-y-2';
      case 'classic':
      default:
        return 'text-left';
    }
  };

  // Get dynamic font sizes based on base font size
  const getFontSizes = () => {
    const base = settings.fontSize;
    return {
      name: `${Math.max(base + 8, 16)}px`, // Name should be larger
      sectionTitle: `${Math.max(base + 2, 12)}px`, // Section titles slightly larger
      body: `${base}px`, // Body text uses base size
      small: `${Math.max(base - 1, 8)}px`, // Small text slightly smaller
    };
  };

  const fontSizes = getFontSizes();

  // Software Engineer template styles
  const getTemplateStyles = () => {
    return {
      container: "bg-white text-black shadow-sm",
      header: "flex justify-between items-start mb-6",
      headerName: "text-xl font-bold mb-3",
      headerDetails: "text-xs space-y-2",
      section: "mb-6",
      sectionTitle: "text-sm font-bold border-b border-gray-200 mb-3 pb-2 uppercase tracking-wide",
      layout: "perfect-fit"
    };
  };

  const templateStyles = getTemplateStyles();
  
  // Debug: Log the current template
  console.log('EnhancedResumePreview - Current template:', settings.template);
  console.log('EnhancedResumePreview - Template styles:', templateStyles);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const formatDateRange = (startDate: string, endDate: string, current: boolean = false) => {
    const start = formatDate(startDate);
    const end = current ? 'Present' : formatDate(endDate);
    return `${start} - ${end}`;
  };

  const renderContactInfo = () => {
    const contacts = [
      { label: 'Email:', value: data.personalInfo.email, href: `mailto:${data.personalInfo.email}`, type: 'email' },
      { label: 'Phone:', value: data.personalInfo.phone, href: `tel:${data.personalInfo.phone}`, type: 'phone' },
      { label: 'Location:', value: data.personalInfo.location, type: 'location' },
      { 
        label: 'Portfolio:', 
        value: data.personalInfo.website, 
        href: data.personalInfo.website?.startsWith('http') ? data.personalInfo.website : `https://${data.personalInfo.website}`, 
        type: 'website'
      },
      { 
        label: 'LinkedIn:', 
        value: data.personalInfo.linkedin, 
        href: data.personalInfo.linkedin?.startsWith('http') ? data.personalInfo.linkedin : `https://linkedin.com/in/${data.personalInfo.linkedin}`, 
        type: 'linkedin'
      },
      { 
        label: 'GitHub:', 
        value: data.personalInfo.github, 
        href: data.personalInfo.github?.startsWith('http') ? data.personalInfo.github : `https://github.com/${data.personalInfo.github}`, 
        type: 'github'
      },
    ].filter(contact => contact.value);

    // Template-specific contact layout
    if (templateStyles.layout === "center-aligned" || templateStyles.layout === "traditional") {
      return (
        <div className="space-y-3 text-center">
          {contacts.map((contact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-gray-600 text-xs py-1 px-2"
            >
              {contact.href ? (
                <span className="whitespace-nowrap">
                  <span className="font-medium">{contact.label}</span>{' '}
                  <a 
                    href={contact.href} 
                    className="hover:underline text-inherit"
                    data-link={contact.href}
                    data-link-type={contact.type}
                  >
                    {contact.value}
                  </a>
                </span>
              ) : (
                <span className="whitespace-nowrap">
                  <span className="font-medium">{contact.label}</span> {contact.value}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      );
    }

    return (
      <div className={`flex flex-wrap gap-10 text-xs text-gray-600 items-center ${templateStyles.layout === "compact" ? "font-mono gap-8" : ""}`}>
        {contacts.map((contact, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center px-2 py-1"
          >
            {contact.href ? (
              <span className="whitespace-nowrap">
                <span className="font-medium">{contact.label}</span>{' '}
                <a 
                  href={contact.href} 
                  className="hover:underline text-gray-600"
                  data-link={contact.href}
                  data-link-type={contact.type}
                >
                  {contact.value}
                </a>
              </span>
            ) : (
              <span className="whitespace-nowrap">
                <span className="font-medium">{contact.label}</span> {contact.value}
              </span>
            )}

          </motion.div>
        ))}
      </div>
    );
  };

  const renderSection = (title: string, children: React.ReactNode, icon?: React.ReactNode) => {
    if (!children) return null;
    
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${templateStyles.section} resume-section avoid-page-break`}
        style={{ 
          marginBottom: `${settings.sectionSpacing || 16}px`,
          textAlign: settings.textAlign === 'justify' ? 'justify' : 'left'
        }}
      >
        <h2 className={templateStyles.sectionTitle} style={{
          borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
        }}>
          {title}
        </h2>
        {children}
      </motion.section>
    );
  };

  const renderExperience = () => {
    if (!data.experience || !data.experience.length) return null;

    return renderSection(
      'Experience',
      <div className="space-y-4">
        {data.experience.map((exp, index) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="experience-item relative pl-4 border-l-2"
            style={{ borderColor: colors.accent }}
          >
            <div 
              className="absolute w-3 h-3 rounded-full -left-2 top-1"
              style={{ backgroundColor: colors.primary }}
            />
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{exp.jobTitle}</h3>
                <p className="text-xs text-gray-700 font-medium">{exp.company}</p>
                {exp.location && <p className="text-xs text-gray-600">{exp.location}</p>}
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateRange(exp.startDate, exp.endDate, exp.current)}
              </div>
            </div>
            {exp.description && (
              <p className="text-xs text-gray-700 mb-2 leading-relaxed">{exp.description}</p>
            )}
            {exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
              <ul className="space-y-1">
                {exp.achievements.map((achievement, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-1">
                      {settings.bulletStyle === 'dash' ? '-' :
                       settings.bulletStyle === 'arrow' ? '→' :
                       settings.bulletStyle === 'chevron' ? '›' : '•'}
                    </span>
                    {achievement}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderEducation = () => {
    if (!data.education || !data.education.length) return null;

    return renderSection(
      'Education',
      <div className="space-y-4">
        {data.education.map((edu, index) => (
          <motion.div
            key={edu.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="education-item relative pl-4 border-l-2"
            style={{ borderColor: colors.accent }}
          >
            <div 
              className="absolute w-3 h-3 rounded-full -left-2 top-1"
              style={{ backgroundColor: colors.primary }}
            />
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 pr-4">
                <div className="font-bold" style={{ fontSize: fontSizes.body }}>{edu.school}</div>
                <div className="italic" style={{ fontSize: fontSizes.body }}>
                  {edu.degree}
                  {edu.gpa && (
                    <>; GPA: {edu.gpa}</>
                  )}
                </div>
                {edu.coursework && edu.coursework.length > 0 && (
                  <div className="mt-1" style={{ fontSize: fontSizes.small }}>
                    <strong>Courses:</strong> {edu.coursework.join(', ')}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0" style={{ fontSize: fontSizes.small }}>
                {edu.location && <div>{edu.location}</div>}
                <div>{formatDateRange(edu.startDate, edu.endDate)}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderSkills = () => {
    const hasSkills = data.skills && Object.values(data.skills).some(skillArray => Array.isArray(skillArray) && skillArray.length > 0);
    if (!hasSkills) return null;

    const skillCategories = [
      { 
        label: 'Programming Languages', 
        skills: data.skills.technical?.filter(skill => 
          ['javascript', 'python', 'java', 'c++', 'typescript', 'go', 'rust', 'swift', 'kotlin', 'c#', 'php', 'ruby'].some(lang => 
            skill.toLowerCase().includes(lang)
          )
        ) || []
      },
      { label: 'Frameworks & Libraries', skills: data.skills.frameworks || [] },
      { 
        label: 'Technical Skills', 
        skills: data.skills.technical?.filter(skill => 
          !['javascript', 'python', 'java', 'c++', 'typescript', 'go', 'rust', 'swift', 'kotlin', 'c#', 'php', 'ruby'].some(lang => 
            skill.toLowerCase().includes(lang)
          )
        ) || []
      },
      { label: 'Soft Skills', skills: data.skills.soft || [] },
    ].filter(category => Array.isArray(category.skills) && category.skills.length > 0);

    return renderSection(
      'Skills',
      <div className="space-y-3">
        {skillCategories.map((category, categoryIndex) => (
          <div key={category.label}>
            <h4 className={`font-medium text-gray-800 mb-2 text-xs ${templateStyles.layout === "compact" ? "font-mono uppercase" : ""}`}>
              {category.label}
            </h4>
            <div className={templateStyles.layout === "compact" ? "grid grid-cols-3 gap-2" : "flex flex-wrap gap-2"}>
              {category.skills.map((skill, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`text-xs font-medium ${
                    templateStyles.layout === "compact" 
                      ? "bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono text-center" 
                      : templateStyles.layout === "traditional"
                      ? "text-gray-700 mr-4"
                      : "px-2 py-1 rounded bg-gray-100 text-gray-700"
                  }`}
                >
                  {templateStyles.layout === "traditional" ? `• ${skill}` : skill}
                </motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProjects = () => {
    if (!settings.enabledSections.projects || !data.projects || !data.projects.length) return null;

    return renderSection(
      'Projects',
      <div className="space-y-4">
        {data.projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="project-item relative pl-4 border-l-2"
            style={{ borderColor: colors.accent }}
          >
            <div 
              className="absolute w-3 h-3 rounded-full -left-2 top-1"
              style={{ backgroundColor: colors.primary }}
            />
            <div className="flex justify-between items-start mb-2">
              <div>
                              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900">{project.name}</h3>
                {project.link && (
                  <a 
                    href={project.link.startsWith('http') ? project.link : `https://${project.link}`} 
                    className="text-blue-600 hover:text-blue-800"
                    data-link={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                    data-link-type="project"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {project.github && (
                  <a 
                    href={project.github.startsWith('http') ? project.github : `https://github.com/${project.github}`} 
                    className="text-gray-600 hover:text-gray-800"
                    data-link={project.github.startsWith('http') ? project.github : `https://github.com/${project.github}`}
                    data-link-type="github"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateRange(project.startDate, project.endDate)}
            </div>
          </div>
          {project.description && (
            <p className="text-xs text-gray-700 mb-2 leading-relaxed">{project.description}</p>
          )}
            {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.technologies.map((tech, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: colors.accent, color: colors.text }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderCertifications = () => {
    if (!settings.enabledSections.certifications || !data.certifications || !data.certifications.length) return null;

    return renderSection(
      'Certifications',
      <div className="space-y-3">
        {data.certifications.map((cert, index) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex justify-between items-start"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900">{cert.name}</h3>
                {cert.link && (
                  <a 
                    href={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`} 
                    className="text-blue-600 hover:text-blue-800"
                    data-link={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`}
                    data-link-type="certification"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-700">{cert.issuer}</p>
              {cert.credentialId && (
                <p className="text-xs text-gray-600">ID: {cert.credentialId}</p>
              )}
            </div>
            <div className="text-xs text-gray-600 text-right">
              <p>{formatDate(cert.date)}</p>
              {cert.expiryDate && (
                <p className="text-xs">Expires: {formatDate(cert.expiryDate)}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderLanguages = () => {
    if (!settings.enabledSections.languages || !data.languages || !data.languages.length) return null;

    return renderSection(
      'Languages',
      <div className="grid grid-cols-2 gap-2">
        {data.languages.map((lang, index) => (
          <motion.div
            key={lang.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-1"
          >
            <span className="font-medium text-xs text-gray-900">{lang.language}:</span>
            <span 
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: colors.accent, color: colors.text }}
            >
              {lang.proficiency}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderVolunteer = () => {
    if (!settings.enabledSections.volunteer || !data.volunteer || !data.volunteer.length) return null;

    return renderSection(
      'Volunteer Experience',
      <div className="space-y-4">
        {data.volunteer.map((vol, index) => (
          <motion.div
            key={vol.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-4 border-l-2"
            style={{ borderColor: colors.accent }}
          >
            <div 
              className="absolute w-3 h-3 rounded-full -left-2 top-1"
              style={{ backgroundColor: colors.primary }}
            />
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{vol.role}</h3>
                <p className="text-xs text-gray-700 font-medium">{vol.organization}</p>
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateRange(vol.startDate, vol.endDate)}
              </div>
            </div>
            {vol.description && (
              <p className="text-xs text-gray-700 leading-relaxed">{vol.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderSummary = () => {
    if (!settings.enabledSections.summary || !data.summary) return null;

    return renderSection(
      'Professional Summary',
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-gray-700 leading-relaxed" style={{ fontSize: fontSizes.body }}>{data.summary}</p>
      </motion.div>
    );
  };

  // Skills Summary
  const renderSkillsSummary = () => {
    if (!settings.enabledSections.skills || !data.skills || !data.skills.languages || !data.skills.frameworks || !data.skills.technical || !data.skills.soft) return null;

    return (
      <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
        <h2 
          className="font-bold mb-2 pb-1" 
          style={{ 
            fontSize: fontSizes.sectionTitle,
            borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
          }}
        >
          SKILLS SUMMARY
        </h2>
        <div className="space-y-1" style={{ fontSize: fontSizes.body }}>
          {data.skills.technical?.length > 0 && (
            <div>
              <strong>Programming Languages:</strong> {data.skills.technical.filter(skill => 
                ['javascript', 'python', 'java', 'c++', 'typescript', 'go', 'rust', 'swift', 'kotlin', 'c#', 'php', 'ruby'].some(lang => 
                  skill.toLowerCase().includes(lang)
                )
              ).join(', ')}
            </div>
          )}
          {data.skills.frameworks?.length > 0 && (
            <div>
              <strong>Frameworks & Libraries:</strong> {data.skills.frameworks.join(', ')}
            </div>
          )}
          {data.skills.technical?.length > 0 && (
            <div>
              <strong>Technical Skills:</strong> {data.skills.technical.filter(skill => 
                !['javascript', 'python', 'java', 'c++', 'typescript', 'go', 'rust', 'swift', 'kotlin', 'c#', 'php', 'ruby'].some(lang => 
                  skill.toLowerCase().includes(lang)
                )
              ).join(', ')}
            </div>
          )}
          {data.skills.soft?.length > 0 && (
            <div>
              <strong>Soft Skills:</strong> {data.skills.soft.join(', ')}
            </div>
          )}
          {data.skills.languages?.length > 0 && (
            <div>
              <strong>Languages:</strong> {data.skills.languages.join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Software Engineer Template Render
  return (
    <div className="w-full max-w-4xl p-4">
      <div id="resume-content" className="bg-white text-black shadow-sm border border-gray-100 min-h-[11in]"
           style={{ 
             width: '210mm',
             minHeight: '297mm',
             padding: getMargins(),
             margin: '0',
             boxSizing: 'border-box',
             fontFamily: getFontFamily(),
             fontSize: `${settings.fontSize}pt`,
             lineHeight: getLineHeight(),
             textAlign: settings.textAlign === 'justify' ? 'justify' : 'left',
             // Add page break styles for better PDF generation
             pageBreakInside: 'auto',
             orphans: 3,
             widows: 3
           }}>
        
        {/* Add CSS for better page break handling */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Ensure Times New Roman is applied to all text elements */
            #resume-content,
            #resume-content * {
              font-family: ${getFontFamily()} !important;
            }
            
            @media print {
              .resume-section {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .experience-item,
              .education-item,
              .project-item,
              .certification-item {
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 16px;
              }
              
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                break-after: avoid;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Ensure second page content starts with proper margin */
              @page:first {
                margin-top: 15mm;
              }
              
              @page {
                margin-top: 15mm;
                margin-bottom: 15mm;
                margin-left: 15mm;
                margin-right: 15mm;
              }
              
              /* Add top border line for subsequent pages */
              @page:not(:first) {
                border-top: 0.5pt solid black;
                margin-top: 17mm; /* Slightly more margin to accommodate border */
              }
            }
            
            /* For PDF generation - ensure proper spacing */
            .page-break-before {
              page-break-before: always;
              break-before: page;
            }
            
            .avoid-page-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Simulate page break with top border for preview */
            .page-break-with-border {
              page-break-before: always;
              break-before: page;
              border-top: 1px solid #000;
              padding-top: 15mm;
              margin-top: 15mm;
            }
            
            /* Visual indicator for second page content in preview */
            .second-page-content {
              position: relative;
            }
            
            .second-page-content::before {
              content: '';
              position: absolute;
              top: -17mm;
              left: 0;
              right: 0;
              height: 1px;
              background-color: #000;
              opacity: 0.3;
            }
          `
        }} />
        
        {/* Header */}
        <div className={getHeaderLayout()} style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
          {settings.headerStyle === 'centered' ? (
            <div className="text-center">
              <h1 className="font-bold mb-2" style={{ fontSize: fontSizes.name }}>
                {data.personalInfo.name || 'Your Name'}
              </h1>
              <div className="space-y-1" style={{ fontSize: fontSizes.small }}>
                {data.personalInfo.email && (
                  <div>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${data.personalInfo.email}`} className="text-blue-600 underline">
                      {data.personalInfo.email}
                    </a>
                  </div>
                )}
                {data.personalInfo.phone && (
                  <div><strong>Mobile:</strong> {data.personalInfo.phone}</div>
                )}
                {data.personalInfo.website && (
                  <div>
                    <strong>Portfolio:</strong>{' '}
                    <a href={data.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.website}
                    </a>
                  </div>
                )}
                {data.personalInfo.linkedin && (
                  <div>
                    <strong>LinkedIn:</strong>{' '}
                    <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.linkedin}
                    </a>
                  </div>
                )}
                {data.personalInfo.github && (
                  <div>
                    <strong>GitHub:</strong>{' '}
                    <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.github}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : settings.headerStyle === 'modern' || settings.headerStyle === 'split-contact-right' ? (
            <>
              <div>
                <h1 className="font-bold mb-2" style={{ fontSize: fontSizes.name }}>
                  {data.personalInfo.name || 'Your Name'}
                </h1>
                <div className="space-y-1" style={{ fontSize: fontSizes.small }}>
                  {data.personalInfo.website && (
                    <div>
                      <strong>Portfolio:</strong>{' '}
                      <a href={data.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {data.personalInfo.website}
                      </a>
                    </div>
                  )}
                  {data.personalInfo.github && (
                    <div>
                      <strong>GitHub:</strong>{' '}
                      <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {data.personalInfo.github}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right space-y-1" style={{ fontSize: fontSizes.small }}>
                {data.personalInfo.email && (
                  <div>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${data.personalInfo.email}`} className="text-blue-600 underline">
                      {data.personalInfo.email}
                    </a>
                  </div>
                )}
                {data.personalInfo.phone && (
                  <div><strong>Mobile:</strong> {data.personalInfo.phone}</div>
                )}
                {data.personalInfo.linkedin && (
                  <div>
                    <strong>LinkedIn:</strong>{' '}
                    <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.linkedin}
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : settings.headerStyle === 'split-contact-left' ? (
            <>
              <div className="text-left space-y-1" style={{ fontSize: fontSizes.small }}>
                {data.personalInfo.email && (
                  <div>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${data.personalInfo.email}`} className="text-blue-600 underline">
                      {data.personalInfo.email}
                    </a>
                  </div>
                )}
                {data.personalInfo.phone && (
                  <div><strong>Mobile:</strong> {data.personalInfo.phone}</div>
                )}
                {data.personalInfo.linkedin && (
                  <div>
                    <strong>LinkedIn:</strong>{' '}
                    <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.linkedin}
                    </a>
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold mb-2 text-right" style={{ fontSize: fontSizes.name }}>
                  {data.personalInfo.name || 'Your Name'}
                </h1>
                <div className="space-y-1 text-right" style={{ fontSize: fontSizes.small }}>
                  {data.personalInfo.website && (
                    <div>
                      <strong>Portfolio:</strong>{' '}
                      <a href={data.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {data.personalInfo.website}
                      </a>
                    </div>
                  )}
                  {data.personalInfo.github && (
                    <div>
                      <strong>GitHub:</strong>{' '}
                      <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {data.personalInfo.github}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : settings.headerStyle === 'split-balanced' ? (
            <>
              <div>
                <h1 className="font-bold mb-2" style={{ fontSize: fontSizes.name }}>
                  {data.personalInfo.name || 'Your Name'}
                </h1>
                {data.personalInfo.email && (
                  <div style={{ fontSize: fontSizes.small }}>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${data.personalInfo.email}`} className="text-blue-600 underline">
                      {data.personalInfo.email}
                    </a>
                  </div>
                )}
                {data.personalInfo.phone && (
                  <div style={{ fontSize: fontSizes.small }}><strong>Mobile:</strong> {data.personalInfo.phone}</div>
                )}
              </div>
              <div className="space-y-1" style={{ fontSize: fontSizes.small }}>
                {data.personalInfo.website && (
                  <div>
                    <strong>Portfolio:</strong>{' '}
                    <a href={data.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.website}
                    </a>
                  </div>
                )}
                {data.personalInfo.linkedin && (
                  <div>
                    <strong>LinkedIn:</strong>{' '}
                    <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.linkedin}
                    </a>
                  </div>
                )}
                {data.personalInfo.github && (
                  <div>
                    <strong>GitHub:</strong>{' '}
                    <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.github}
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : settings.headerStyle === 'minimalist' ? (
            <>
              <h1 className="font-bold" style={{ fontSize: fontSizes.name }}>
                {data.personalInfo.name || 'Your Name'}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: fontSizes.small }}>
                {data.personalInfo.email && (
                  <a href={`mailto:${data.personalInfo.email}`} className="text-blue-600 underline">
                    {data.personalInfo.email}
                  </a>
                )}
                {data.personalInfo.phone && (
                  <span>{data.personalInfo.phone}</span>
                )}
                {data.personalInfo.website && (
                  <a href={data.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Portfolio
                  </a>
                )}
                {data.personalInfo.linkedin && (
                  <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    LinkedIn
                  </a>
                )}
                {data.personalInfo.github && (
                  <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    GitHub
                  </a>
                )}
              </div>
            </>
          ) : (
            // Classic style
            <div>
              <h1 className="font-bold mb-2" style={{ fontSize: fontSizes.name }}>
                {data.personalInfo.name || 'Your Name'}
              </h1>
              <div className="space-y-1" style={{ fontSize: fontSizes.small }}>
                {data.personalInfo.email && (
                  <div>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${data.personalInfo.email}`} className="text-blue-600 underline">
                      {data.personalInfo.email}
                    </a>
                  </div>
                )}
                {data.personalInfo.phone && (
                  <div><strong>Mobile:</strong> {data.personalInfo.phone}</div>
                )}
                {data.personalInfo.website && (
                  <div>
                    <strong>Portfolio:</strong>{' '}
                    <a href={data.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.website}
                    </a>
                  </div>
                )}
                {data.personalInfo.linkedin && (
                  <div>
                    <strong>LinkedIn:</strong>{' '}
                    <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.linkedin}
                    </a>
                  </div>
                )}
                {data.personalInfo.github && (
                  <div>
                    <strong>GitHub:</strong>{' '}
                    <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {data.personalInfo.github}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Professional Summary */}
        <div className="avoid-page-break">
          {renderSummary()}
        </div>

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="resume-section avoid-page-break" style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              EDUCATION
            </h2>
            {data.education.map((edu, index) => (
              <div key={edu.id || index} className="education-item flex justify-between items-start mb-2">
                <div className="flex-1 pr-4">
                  <div className="font-bold" style={{ fontSize: fontSizes.body }}>{edu.school}</div>
                  <div className="italic" style={{ fontSize: fontSizes.body }}>
                    {edu.degree}
                    {edu.gpa && (
                      <>; GPA: {edu.gpa}</>
                    )}
                  </div>
                  {edu.coursework && edu.coursework.length > 0 && (
                    <div className="mt-1" style={{ fontSize: fontSizes.small }}>
                      <strong>Courses:</strong> {edu.coursework.join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0" style={{ fontSize: fontSizes.small }}>
                  {edu.location && <div>{edu.location}</div>}
                  <div>{formatDateRange(edu.startDate, edu.endDate)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Summary */}
        {(data.skills.languages?.length > 0 || data.skills.frameworks?.length > 0 || data.skills.technical?.length > 0 || data.skills.soft?.length > 0) && (
          <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              SKILLS SUMMARY
            </h2>
            <div className="space-y-1" style={{ fontSize: fontSizes.body }}>
              {data.skills.technical?.length > 0 && (
                <div>
                  <strong>Programming Languages:</strong> {data.skills.technical.filter(skill => 
                    ['javascript', 'python', 'java', 'c++', 'typescript', 'go', 'rust', 'swift', 'kotlin', 'c#', 'php', 'ruby'].some(lang => 
                      skill.toLowerCase().includes(lang)
                    )
                  ).join(', ')}
                </div>
              )}
              {data.skills.frameworks?.length > 0 && (
                <div>
                  <strong>Frameworks & Libraries:</strong> {data.skills.frameworks.join(', ')}
                </div>
              )}
              {data.skills.technical?.length > 0 && (
                <div>
                  <strong>Technical Skills:</strong> {data.skills.technical.filter(skill => 
                    !['javascript', 'python', 'java', 'c++', 'typescript', 'go', 'rust', 'swift', 'kotlin', 'c#', 'php', 'ruby'].some(lang => 
                      skill.toLowerCase().includes(lang)
                    )
                  ).join(', ')}
                </div>
              )}
              {data.skills.soft?.length > 0 && (
                <div>
                  <strong>Soft Skills:</strong> {data.skills.soft.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              EXPERIENCE
            </h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-bold" style={{ fontSize: fontSizes.body }}>{exp.company}</div>
                    <div className="italic" style={{ fontSize: fontSizes.body }}>{exp.jobTitle}</div>
                  </div>
                  <div className="text-right" style={{ fontSize: fontSizes.small }}>
                    <div>{exp.location}</div>
                    <div>{formatDateRange(exp.startDate, exp.endDate, exp.current)}</div>
                  </div>
                </div>
                {exp.description && (
                  <div className="ml-3 mb-1">
                    <div style={{ fontSize: fontSizes.body }}>{exp.description}</div>
                  </div>
                )}
                {exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <div className="ml-3">
                    {exp.achievements.map((achievement, idx) => (
                      <div key={idx} className="mb-1" style={{ fontSize: fontSizes.body }}>
                        {settings.bulletStyle === 'dash' ? '-' :
                         settings.bulletStyle === 'arrow' ? '→' :
                         settings.bulletStyle === 'chevron' ? '›' : '•'} {achievement}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              PROJECTS
            </h2>
            {data.projects.map((project) => (
              <div key={project.id} className="mb-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-bold" style={{ fontSize: fontSizes.body }}>{project.name}</div>
                    {project.description && (
                      <div style={{ fontSize: fontSizes.body }}>{project.description}</div>
                    )}
                    {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                      <div style={{ fontSize: fontSizes.small }}>
                        <strong>Technologies:</strong> {project.technologies.join(', ')}
                      </div>
                    )}
                    {project.link && (
                      <div style={{ fontSize: fontSizes.small }}>
                        <strong>Live Link:</strong> <a href={project.link.startsWith('http') ? project.link : `https://${project.link}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{project.link}</a>
                      </div>
                    )}
                    {project.github && (
                      <div style={{ fontSize: fontSizes.small }}>
                        <strong>GitHub:</strong> <a href={project.github.startsWith('http') ? project.github : `https://${project.github}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{project.github}</a>
                      </div>
                    )}
                  </div>
                  <div className="text-right" style={{ fontSize: fontSizes.small }}>
                    {(project.startDate || project.endDate) && (
                      <div>{formatDateRange(project.startDate, project.endDate)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              CERTIFICATIONS
            </h2>
            {data.certifications.map((cert) => (
              <div key={cert.id} className="mb-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-bold" style={{ fontSize: fontSizes.body }}>{cert.name}</div>
                    {cert.issuer && (
                      <div className="italic" style={{ fontSize: fontSizes.body }}>{cert.issuer}</div>
                    )}
                    {cert.credentialId && (
                      <div style={{ fontSize: fontSizes.small }}>Credential ID: {cert.credentialId}</div>
                    )}
                    {cert.link && (
                      <div style={{ fontSize: fontSizes.small }}>Verification: <a href={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{cert.link}</a></div>
                    )}
                  </div>
                  <div className="text-right" style={{ fontSize: fontSizes.small }}>
                    {cert.date && <div>Issued: {cert.date}</div>}
                    {cert.expiryDate && <div>Expires: {cert.expiryDate}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Volunteer Experience */}
        {data.volunteer && data.volunteer.length > 0 && (
          <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              VOLUNTEER EXPERIENCE
            </h2>
            {data.volunteer.map((vol) => (
              <div key={vol.id} className="mb-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-bold" style={{ fontSize: fontSizes.body }}>{vol.role} at {vol.organization}</div>
                    <div className="italic" style={{ fontSize: fontSizes.body }}>{vol.description}</div>
                  </div>
                  <div className="text-right" style={{ fontSize: fontSizes.small }}>
                    <div>{formatDateRange(vol.startDate, vol.endDate)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              LANGUAGES
            </h2>
            <div className="grid grid-cols-2 gap-1">
              {data.languages.map((lang) => (
                <div key={lang.id} className="flex items-center gap-1" style={{ fontSize: fontSizes.body }}>
                  <span className="font-medium">{lang.language}:</span>
                  <span style={{ fontSize: fontSizes.small }}>{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Awards and Honors */}
        {data.awards && data.awards.length > 0 && (
          <div style={{ marginBottom: `${settings.sectionSpacing || 16}px` }}>
            <h2 
              className="font-bold mb-2 pb-1" 
              style={{ 
                fontSize: fontSizes.sectionTitle,
                borderBottom: settings.showDividers !== false ? '1px solid black' : 'none'
              }}
            >
              AWARDS AND HONORS
            </h2>
            {data.awards.map((award) => (
              <div key={award.id} className="mb-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-bold" style={{ fontSize: fontSizes.body }}>{award.title}</div>
                    {award.issuer && (
                      <div className="italic" style={{ fontSize: fontSizes.body }}>{award.issuer}</div>
                    )}
                    {award.description && (
                      <div style={{ fontSize: fontSizes.body }}>{award.description}</div>
                    )}
                  </div>
                  {award.date && (
                    <div className="text-right" style={{ fontSize: fontSizes.small }}>
                      <div>{award.date}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
