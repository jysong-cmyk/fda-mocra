import { deleteApplyCartLineAction } from "@/app/apply/label-storage-actions";
import type { CartLine } from "@/lib/apply/types-and-constants";

/**
 * 장바구니 줄 삭제: 서버에서 DB `session_id` 검증 후 스토리지·`products` 행 삭제.
 * Storage 삭제 실패 시에도 서버 쪽에서 DB 삭제는 진행합니다.
 */
export async function deleteCartLineWithStorageCleanup(
  line: CartLine,
  localSessionId: string,
): Promise<{ error: string | null }> {
  const local = localSessionId.trim();
  const rowSession = line.sessionId?.trim() ?? "";
  if (local === "" || rowSession === "" || local !== rowSession) {
    return {
      error:
        "이 브라우저 세션에서 담은 제품만 삭제할 수 있습니다. 페이지를 새로고침 하거나 동일 기기·탭에서 다시 시도해 주세요.",
    };
  }

  return deleteApplyCartLineAction({
    productId: line.id,
    sessionId: local,
  });
}
