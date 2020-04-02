import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { fromLazyLoad } from '../utils';
import { ContentSecurityStrategy, CONTENT_SECURITY_STRATEGY } from './content-security.strategy';
import { CrossOriginStrategy, CROSS_ORIGIN_STRATEGY } from './cross-origin.strategy';
import { DomStrategy, DOM_STRATEGY } from './dom.strategy';

export abstract class LoadingStrategy<T extends HTMLScriptElement | HTMLLinkElement = any> {
  constructor(
    public path: string,
    protected domStrategy: DomStrategy = DOM_STRATEGY.AppendToHead(),
    protected crossOriginStrategy: CrossOriginStrategy = CROSS_ORIGIN_STRATEGY.Anonymous(),
    protected contentSecurityStrategy: ContentSecurityStrategy = CONTENT_SECURITY_STRATEGY.Loose(),
  ) {}

  abstract createElement(): T;

  createStream<E extends Event>(): Observable<E> {
    return of(null).pipe(
      switchMap(() =>
        fromLazyLoad<E>(
          this.createElement(),
          this.domStrategy,
          this.crossOriginStrategy,
          this.contentSecurityStrategy,
        ),
      ),
    );
  }
}

export class ScriptLoadingStrategy extends LoadingStrategy<HTMLScriptElement> {
  constructor(
    src: string,
    domStrategy?: DomStrategy,
    crossOriginStrategy?: CrossOriginStrategy,
    contentSecurityStrategy?: ContentSecurityStrategy,
  ) {
    super(src, domStrategy, crossOriginStrategy, contentSecurityStrategy);
  }

  createElement(): HTMLScriptElement {
    const element = document.createElement('script');
    element.src = this.path;

    return element;
  }
}

export class StyleLoadingStrategy extends LoadingStrategy<HTMLLinkElement> {
  constructor(
    href: string,
    domStrategy?: DomStrategy,
    crossOriginStrategy?: CrossOriginStrategy,
    contentSecurityStrategy?: ContentSecurityStrategy,
  ) {
    super(href, domStrategy, crossOriginStrategy, contentSecurityStrategy);
  }

  createElement(): HTMLLinkElement {
    const element = document.createElement('link');
    element.rel = 'stylesheet';
    element.href = this.path;

    return element;
  }
}

export const LOADING_STRATEGY = {
  AppendAnonymousScriptToBody(src: string) {
    return new ScriptLoadingStrategy(src, DOM_STRATEGY.AppendToBody());
  },
  AppendAnonymousScriptToHead(src: string) {
    return new ScriptLoadingStrategy(src);
  },
  AppendAnonymousStyleToHead(src: string) {
    return new StyleLoadingStrategy(src);
  },
  PrependAnonymousScriptToHead(src: string) {
    return new ScriptLoadingStrategy(src, DOM_STRATEGY.PrependToHead());
  },
  PrependAnonymousStyleToHead(src: string) {
    return new StyleLoadingStrategy(src, DOM_STRATEGY.PrependToHead());
  },
};
