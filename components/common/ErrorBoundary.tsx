"use client";

/**
 * 범용 ErrorBoundary.
 *
 * React 19에서도 함수 컴포넌트로 ErrorBoundary는 만들 수 없음
 *  (getDerivedStateFromError + componentDidCatch가 클래스 전용).
 *
 * 책임: 자식 트리에서 throw된 에러를 잡아 fallback UI로 대체.
 *  - 동기 에러만 잡음 (Promise throw는 Suspense가 처리)
 *  - 한 ErrorBoundary가 잡는 범위는 자식 트리 전체 → 섹션 단위로 배치해 격리
 */
import { Component, type ReactNode } from "react";

type Props = {
  fallback: ReactNode;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  // 에러 발생 시 React가 호출. 새 state 반환 → 다음 render에서 fallback 표시
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
