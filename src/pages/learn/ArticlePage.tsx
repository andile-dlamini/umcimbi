import { useParams, Navigate } from 'react-router-dom';
import { getArticleById } from '@/data/learnArticles';
import { ArticleDetail } from '@/components/learn/ArticleDetail';

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  
  if (!articleId) {
    return <Navigate to="/learn" replace />;
  }

  const article = getArticleById(articleId);

  if (!article) {
    return <Navigate to="/learn" replace />;
  }

  return <ArticleDetail article={article} />;
}
