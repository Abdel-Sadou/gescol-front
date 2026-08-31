import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CobimagBase } from '../../shared/cobimag-base';
import { ARTICLES } from '../../data/school-data';

@Component({
  selector: 'app-article',
  standalone: true,
  templateUrl: './article.component.html',
})
export class ArticleComponent extends CobimagBase implements OnInit {
  private route = inject(ActivatedRoute);
  articleId = ARTICLES[0].id;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && ARTICLES.some(a => a.id === id)) this.articleId = id;
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    });
  }

  get article(): any {
    return ARTICLES.find(a => a.id === this.articleId) || ARTICLES[0];
  }

  /** Le corps de l'article, avec un drapeau par type de bloc pour le template. */
  get articleBody() {
    return this.article.body.map((b: any, i: number) => ({
      ...b,
      isP: b.kind === 'p',
      isH: b.kind === 'h',
      isQuote: b.kind === 'quote',
      key: i,
    }));
  }

  get relatedArticles() {
    return ARTICLES
      .filter(a => a.id !== this.article.id)
      .map(a => ({ ...a, open: this.goArticle(a.id) }));
  }
}
