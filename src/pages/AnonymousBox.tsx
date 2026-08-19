import PlaceholderPage from '@/components/PlaceholderPage'

export default function AnonymousBox() {
  return (
    <PlaceholderPage
      title="匿名提问系统"
      desc="安全、受老师管理的匿名表达空间，让学生敢于提问"
      features={[
        '学生匿名私信老师',
        '匿名提交问题',
        '老师私下回复',
        '老师选择匿名公开讨论',
        '无开放社区/自由聊天功能',
        '平台内容安全审核',
      ]}
    />
  )
}
