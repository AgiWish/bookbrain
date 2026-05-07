type ClassificationInput = {
  title: string
  url: string
  description?: string
}

type ClassificationResult = {
  category: string
  subfolder: string
  tags: string[]
}

type Rule = {
  category: string
  subfolder: string
  /** Exact host or any subdomain of the listed host. */
  hosts?: string[]
  /** Substring matched against host (`bilibili` matches `m.bilibili.com`). */
  hostKeywords?: string[]
  /** Matched against the lowercased title + url + description. */
  keywords: string[]
}

// Order matters only for tie-breaking — scoring picks the highest score first.
const CATEGORY_RULES: Rule[] = [
  // ───── 影视娱乐 ─────────────────────────────────────────────────────────
  {
    category: '影视娱乐',
    subfolder: '影视站点',
    hostKeywords: ['dy', 'dianying', 'film', 'movie', 'kan', 'tv', 'ys', 'video'],
    keywords: [
      '电影', '影视', '韩剧', '美剧', '日剧', '动漫', '番剧', '在线观看', '免费观看',
      '剧集', '综艺', '影院', '高清', 'movie', 'cinema', 'episode',
    ],
  },
  {
    category: '影视娱乐',
    subfolder: '视频平台',
    hosts: [
      'bilibili.com', 'youtube.com', 'youku.com', 'iqiyi.com', 'v.qq.com',
      'mgtv.com', 'le.com', 'tudou.com', 'douyin.com', 'kuaishou.com',
      'netflix.com', 'twitch.tv',
    ],
    keywords: ['视频', 'video', '直播', 'live', '弹幕'],
  },
  {
    category: '影视娱乐',
    subfolder: '音乐',
    hosts: ['music.163.com', 'y.qq.com', 'kugou.com', 'kuwo.cn', 'spotify.com'],
    keywords: ['音乐', '歌单', '专辑', 'music', 'album', 'playlist'],
  },

  // ───── 资讯媒体 ─────────────────────────────────────────────────────────
  {
    category: '资讯媒体',
    subfolder: '新闻资讯',
    hosts: [
      'news.qq.com', 'sina.com.cn', 'sohu.com', '163.com', 'thepaper.cn',
      'bbc.com', 'cnn.com', 'nytimes.com', 'reuters.com', 'bloomberg.com',
      '36kr.com', 'huxiu.com', 'tmtpost.com',
    ],
    keywords: ['新闻', '快讯', '财经', '头条', 'news', 'press', 'report'],
  },
  {
    category: '资讯媒体',
    subfolder: '社区论坛',
    hosts: [
      'zhihu.com', 'reddit.com', 'v2ex.com', 'tieba.baidu.com', 'douban.com',
      'weibo.com', 'twitter.com', 'x.com',
    ],
    keywords: ['论坛', '社区', '问答', '讨论', '微博', 'forum', 'community'],
  },

  // ───── 电商购物 ─────────────────────────────────────────────────────────
  {
    category: '电商购物',
    subfolder: '购物平台',
    hosts: [
      'taobao.com', 'tmall.com', 'jd.com', 'pinduoduo.com', 'amazon.com',
      'amazon.cn', 'suning.com', 'vip.com', 'xiaohongshu.com',
    ],
    keywords: ['购物', '商城', '优惠', '价格', '商品', 'shop', 'store', 'deal', 'price'],
  },

  // ───── 开发工程 ─────────────────────────────────────────────────────────
  {
    category: '开发工程',
    subfolder: 'GitHub',
    hosts: ['github.com', 'gitlab.com', 'gitee.com', 'bitbucket.org'],
    keywords: ['github', 'gitlab', 'repository', 'repo', '开源', '代码仓库'],
  },
  {
    category: '开发工程',
    subfolder: '前端开发',
    keywords: [
      'next.js', 'nextjs', 'react', 'vue', 'svelte', 'tailwind', 'frontend',
      'css', 'typescript', 'javascript', 'html', '前端', 'webpack', 'vite',
    ],
  },
  {
    category: '开发工程',
    subfolder: '后端开发',
    keywords: [
      'spring', 'java', 'node.js', 'nestjs', 'django', 'flask', 'rails',
      'postgres', 'mysql', 'redis', 'mongodb', 'api', 'server', 'golang',
      'rust', '后端', 'graphql', 'rest',
    ],
  },
  {
    category: '开发工程',
    subfolder: '移动开发',
    keywords: ['android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', '小程序', '移动端'],
  },

  // ───── 智能工具 / AI ─────────────────────────────────────────────────────
  {
    category: '智能工具',
    subfolder: 'AI 工具',
    hosts: [
      'openai.com', 'claude.ai', 'anthropic.com', 'deepseek.com', 'chatgpt.com',
      'gemini.google.com', 'huggingface.co', 'kimi.moonshot.cn', 'doubao.com',
    ],
    keywords: [
      'ai', 'llm', 'gpt', 'openai', 'claude', 'deepseek', 'gemini', 'agent',
      'prompt', '大模型', '人工智能', 'mcp', 'rag', 'embedding',
    ],
  },

  // ───── 设计素材 ─────────────────────────────────────────────────────────
  {
    category: '设计素材',
    subfolder: '设计工具',
    hosts: ['figma.com', 'dribbble.com', 'behance.net', 'sketch.com', 'canva.com'],
    keywords: ['figma', 'design', 'ui', 'ux', 'icon', 'illustration', '设计', '素材', '原型', '配色'],
  },

  // ───── 数据 / 运维 ──────────────────────────────────────────────────────
  {
    category: '数据分析',
    subfolder: '数据工具',
    keywords: [
      'analytics', 'dashboard', 'chart', 'visualization', 'tableau', 'bi',
      'metabase', 'superset', '数据', '可视化', '图表', '报表',
    ],
  },
  {
    category: '运维管理',
    subfolder: '云服务',
    hosts: [
      'aliyun.com', 'cloud.tencent.com', 'console.cloud.google.com',
      'aws.amazon.com', 'cloud.baidu.com', 'huaweicloud.com',
    ],
    keywords: [
      'docker', 'kubernetes', 'k8s', 'nginx', 'linux', 'server', 'deploy',
      'devops', '云服务', '部署', '运维', 'ci/cd',
    ],
  },

  // ───── 学习资源 ─────────────────────────────────────────────────────────
  {
    category: '学习资源',
    subfolder: '技术文章',
    hosts: [
      'juejin.cn', 'csdn.net', 'cnblogs.com', 'stackoverflow.com', 'medium.com',
      'segmentfault.com', 'dev.to', 'infoq.cn',
    ],
    keywords: ['tutorial', 'guide', 'docs', 'documentation', 'learn', 'course', '教程', '文档', '学习', '博客'],
  },
  {
    category: '学习资源',
    subfolder: '在线课程',
    hosts: ['coursera.org', 'udemy.com', 'edx.org', 'imooc.com', 'xuetangx.com'],
    keywords: ['course', 'lecture', 'mooc', '慕课', '公开课', '课程'],
  },

  // ───── 办公协作 ─────────────────────────────────────────────────────────
  {
    category: '办公协作',
    subfolder: '协作工具',
    hosts: [
      'docs.qq.com', 'kdocs.cn', 'feishu.cn', 'larksuite.com', 'notion.so',
      'office.com', 'docs.google.com',
    ],
    keywords: ['doc', 'document', 'office', 'workspace', '文档', '协作', '会议', '看板'],
  },

  // ───── 工具箱 ──────────────────────────────────────────────────────────
  {
    category: '工具箱',
    subfolder: '效率工具',
    keywords: ['tool', 'converter', 'generator', 'download', 'extension', '插件', '转换', '生成器', '工具'],
  },
]

const STOP_WORDS = new Set([
  'https', 'http', 'www', 'com', 'cn', 'org', 'net', 'the', 'and', 'for', 'with',
  '一个', '这个', '以及', '使用', '如何', '什么', '免费', '在线',
])

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase()
  } catch {
    return ''
  }
}

function normalizeText(input: ClassificationInput): string {
  return `${input.title} ${input.url} ${input.description ?? ''}`.toLowerCase()
}

function extractKeywordTags(input: ClassificationInput, baseTags: string[]): string[] {
  const text = `${input.title} ${input.description ?? ''}`
  const words = text
    .split(/[^\p{L}\p{N}.+#-]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 24)
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()))

  return [...new Set([...baseTags, ...words])].slice(0, 5)
}

function scoreRule(rule: Rule, host: string, path: string, text: string): number {
  let score = 0

  if (rule.hosts?.some((h) => host === h || host.endsWith(`.${h}`))) {
    score += 10
  }
  if (rule.hostKeywords?.some((k) => host.includes(k))) {
    score += 4
  }
  for (const keyword of rule.keywords) {
    const k = keyword.toLowerCase()
    if (text.includes(k)) score += 2
    if (path.includes(k)) score += 1
  }
  return score
}

export function classifyBookmark(input: ClassificationInput): ClassificationResult {
  const host = hostOf(input.url)
  const path = pathOf(input.url)
  const text = normalizeText(input)

  let best: Rule | null = null
  let bestScore = 0

  for (const rule of CATEGORY_RULES) {
    const score = scoreRule(rule, host, path, text)
    if (score > bestScore) {
      best = rule
      bestScore = score
    }
  }

  // No rule matched with confidence — fall back to a neutral category instead
  // of bucketing everything into the last rule (which previously sent every
  // unknown site to "工具箱 / 效率工具").
  if (!best || bestScore < 2) {
    const domainTag = host.split('.')[0]
    return {
      category: '其他',
      subfolder: '未分类',
      tags: extractKeywordTags(input, [domainTag].filter(Boolean)),
    }
  }

  const domainTag = host.split('.')[0]
  const tags = extractKeywordTags(input, [best.subfolder, domainTag].filter(Boolean))

  return {
    category: best.category,
    subfolder: best.subfolder,
    tags,
  }
}
