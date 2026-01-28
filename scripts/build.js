import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import hljs from 'highlight.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Инициализация markdown-it с подсветкой синтаксиса
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs language-' + lang + '">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
}).use(markdownItAnchor, {
  permalink: false
});

// Утилиты
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const readingTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};

// Загрузка шаблонов
const loadTemplate = (name) => {
  const templatePath = path.join(ROOT, 'templates', `${name}.html`);
  return fs.readFileSync(templatePath, 'utf-8');
};

// Простой шаблонизатор
const renderTemplate = (template, data) => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
};

// Загрузка всех постов
const loadPosts = async () => {
  const postFiles = await glob('content/posts/*.md', { cwd: ROOT });
  const posts = [];

  for (const file of postFiles) {
    const filePath = path.join(ROOT, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const slug = path.basename(file, '.md');
    const html = md.render(content);

    posts.push({
      slug,
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      excerpt: data.excerpt || '',
      content: html,
      readingTime: readingTime(content),
      rawContent: content
    });
  }

  // Сортировка по дате (новые первыми)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
};

// Загрузка всех сниппетов
const loadSnippets = async () => {
  const snippetFiles = await glob('content/snippets/*.md', { cwd: ROOT });
  const snippets = [];

  for (const file of snippetFiles) {
    const filePath = path.join(ROOT, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const slug = path.basename(file, '.md');
    const html = md.render(content);

    snippets.push({
      slug,
      title: data.title,
      category: data.category || 'Общее',
      tags: data.tags || [],
      language: data.language || 'bash',
      content: html,
      rawContent: content
    });
  }

  return snippets;
};

// Загрузка всех проектов
const loadProjects = async () => {
  const projectFiles = await glob('content/projects/*.md', { cwd: ROOT });
  const projects = [];

  for (const file of projectFiles) {
    const filePath = path.join(ROOT, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const slug = path.basename(file, '.md');
    const html = md.render(content);

    projects.push({
      slug,
      title: data.title,
      icon: data.icon || '📦',
      tech: data.tech || [],
      github: data.github || '',
      demo: data.demo || '',
      description: html,
      rawContent: content
    });
  }

  return projects;
};

// Генерация карточек постов для главной страницы
const generatePostCards = (posts, limit = 6) => {
  return posts.slice(0, limit).map(post => `
    <article class="post-card" onclick="window.location.href='posts/${post.slug}.html'">
      <div class="post-header">
        <h3 class="post-title">${post.title}</h3>
      </div>
      <p class="post-excerpt">${post.excerpt}</p>
      <div class="post-meta">
        <span class="post-date">
          <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
          ${formatDate(post.date)}
        </span>
      </div>
      <div class="post-tags">
        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('\n        ')}
      </div>
    </article>
  `).join('\n');
};

// Генерация карточек сниппетов
const generateSnippetCards = (snippets) => {
  return snippets.map((snippet, index) => `
    <article class="snippet-card">
      <div class="snippet-header">
        <div>
          <h3 class="snippet-title">${snippet.title}</h3>
          <p class="snippet-description">${snippet.category}</p>
        </div>
        <button class="copy-btn" onclick="copySnippet(this, 'snippet${index}')">
          <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
          Копировать
        </button>
      </div>
      <div class="snippet-code" id="snippet${index}">
        ${snippet.content}
      </div>
      <div class="snippet-footer">
        ${snippet.tags.map(tag => `<span class="tag">${tag}</span>`).join('\n        ')}
      </div>
    </article>
  `).join('\n');
};

// Генерация карточек проектов
const generateProjectCards = (projects) => {
  return projects.map(project => `
    <article class="project-card">
      <div class="project-image">${project.icon}</div>
      <div class="project-content">
        <div class="project-header">
          <h3 class="project-title">${project.title}</h3>
        </div>
        ${project.description}
        <div class="tech-stack">
          ${project.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('\n          ')}
        </div>
        <div class="project-links">
          ${project.github ? `
          <a href="${project.github}" class="project-link" target="_blank">
            <i data-lucide="github" style="width: 16px; height: 16px;"></i>
            GitHub
          </a>` : ''}
          ${project.demo ? `
          <a href="${project.demo}" class="project-link demo">
            <i data-lucide="external-link" style="width: 16px; height: 16px;"></i>
            Демо
          </a>` : ''}
        </div>
      </div>
    </article>
  `).join('\n');
};

// Сборка
const build = async () => {
  console.log('🚀 Начинаем сборку...\n');

  // Очистка и создание dist/
  await fs.emptyDir(path.join(ROOT, 'dist'));
  console.log('✓ Очистили dist/');

  // Копирование статики
  await fs.copy(
    path.join(ROOT, 'src/styles'),
    path.join(ROOT, 'dist/styles')
  );
  console.log('✓ Скопировали стили');

  if (await fs.pathExists(path.join(ROOT, 'public'))) {
    await fs.copy(
      path.join(ROOT, 'public'),
      path.join(ROOT, 'dist')
    );
    console.log('✓ Скопировали public/');
  }

  // Загрузка контента
  const posts = await loadPosts();
  const snippets = await loadSnippets();
  const projects = await loadProjects();

  console.log(`✓ Загружено: ${posts.length} постов, ${snippets.length} сниппетов, ${projects.length} проектов\n`);

  // Загрузка шаблонов
  const baseTemplate = loadTemplate('base');
  const homeTemplate = loadTemplate('home');
  const postTemplate = loadTemplate('post');
  const snippetsTemplate = loadTemplate('snippets');
  const projectsTemplate = loadTemplate('projects');

  // Генерация главной страницы
  const homeContent = renderTemplate(homeTemplate, {
    postCards: generatePostCards(posts)
  });
  const homePage = renderTemplate(baseTemplate, {
    title: 'Alexander Shalin - DevOps Blog',
    activeNav: 'home',
    basePath: '.',
    content: homeContent
  });
  await fs.writeFile(path.join(ROOT, 'dist/index.html'), homePage);
  console.log('✓ Создали index.html');

  // Генерация страниц постов
  await fs.ensureDir(path.join(ROOT, 'dist/posts'));
  for (const post of posts) {
    const relatedPosts = posts
      .filter(p => p.slug !== post.slug)
      .slice(0, 3);

    const postContent = renderTemplate(postTemplate, {
      title: post.title,
      date: formatDate(post.date),
      readingTime: post.readingTime,
      tags: post.tags.map(tag => `<span class="tag">${tag}</span>`).join('\n        '),
      content: post.content,
      relatedPosts: relatedPosts.map(p => `
        <a href="${p.slug}.html" class="related-card">
          <h3 class="related-card-title">${p.title}</h3>
          <p class="related-card-excerpt">${p.excerpt}</p>
        </a>
      `).join('\n')
    });

    const postPage = renderTemplate(baseTemplate, {
      title: `${post.title} - Alexander Shalin`,
      activeNav: 'posts',
      basePath: '..',
      content: postContent
    });

    await fs.writeFile(
      path.join(ROOT, 'dist/posts', `${post.slug}.html`),
      postPage
    );
  }
  console.log(`✓ Создали ${posts.length} страниц постов`);

  // Генерация страницы сниппетов
  const snippetsContent = renderTemplate(snippetsTemplate, {
    snippetCards: generateSnippetCards(snippets)
  });
  const snippetsPage = renderTemplate(baseTemplate, {
    title: 'Сниппеты - Alexander Shalin',
    activeNav: 'snippets',
    basePath: '.',
    content: snippetsContent
  });
  await fs.writeFile(path.join(ROOT, 'dist/snippets.html'), snippetsPage);
  console.log('✓ Создали snippets.html');

  // Генерация страницы проектов
  const projectsContent = renderTemplate(projectsTemplate, {
    projectCards: generateProjectCards(projects)
  });
  const projectsPage = renderTemplate(baseTemplate, {
    title: 'Проекты - Alexander Shalin',
    activeNav: 'projects',
    basePath: '.',
    content: projectsContent
  });
  await fs.writeFile(path.join(ROOT, 'dist/projects.html'), projectsPage);
  console.log('✓ Создали projects.html');

  // Копирование VLESS инструкции
  const vlessSource = path.join(ROOT, 'vless_instructions.html');
  if (await fs.pathExists(vlessSource)) {
    await fs.copy(vlessSource, path.join(ROOT, 'dist/instruct.html'));
    console.log('✓ Скопировали instruct.html');
  }

  console.log('\n✅ Сборка завершена! Результат в dist/\n');
};

// Запуск
build().catch(err => {
  console.error('❌ Ошибка сборки:', err);
  process.exit(1);
});
