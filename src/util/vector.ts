import Vector from 'victor';

export { Vector };

// X方向のベクトル
export const vX = new Vector(1, 0);
// Y方向のベクトル
export const vY = new Vector(0, 1);

/**
 * v1 と v2 の間にある vp を取得する
 * @param v1
 * @param v2
 * @param alpha
 * @returns
 */
export const lerp = (v1: Vector, v2: Vector, alpha: number): Vector => {
    if (alpha >= 1) {
        return v2;
    }
    if (alpha <= 0) {
        return v1;
    }
    const dir = v2.clone().subtract(v1).normalize();
    const distance = v1.distance(v2);
    const mv = dir.multiplyScalar(distance * alpha);
    return v1.clone().add(mv);
};

/**
 * v1 と v2 に直交する単位ベクトルを返す
 * @param v1
 * @param v2
 * @returns
 */
export const verticalNormalizeVector = (v1: Vector, v2: Vector): Vector => {
    const dir = v2.clone().subtract(v1).normalize();
    const v = new Vector(dir.y, dir.x * -1).normalize();

    const value = vY.dot(v);
    if (value > 0) {
        v.invert();
    }

    return v;
};

const InsideArrowCount = 10;
const InsideArrowInterval = 25;
const InsideArrowMinInterval = 10;

/**
 * 開始点から終了点まで等間隔に点を取る
 * @param start
 * @param end
 * @param direction
 * @returns
 */
export const getInsidePoints = (start: Vector, end: Vector, direction: Vector): Vector[] => {
    const points: Vector[] = [];
    // 2点間の距離
    const distance = start.distance(end);
    // 分割数
    let count = InsideArrowCount;
    // 間隔
    let interval = distance / (count + 1);
    while (interval < InsideArrowInterval && count > 0) {
        count--;
        interval = distance / (count + 1);
    }

    if (count > 0) {
        // 始点から interval の間隔で count 個 点を取る
        for (let i = 1; i <= count; i++) {
            const point = start.clone().add(direction.clone().multiplyScalar(interval * i));
            points.push(point);
        }
    } else {
        // 半分にしてみる
        interval = distance / 2;
        if (interval >= InsideArrowMinInterval) {
            // 半分の位置に点を置く
            const point = lerp(start, end, 0.5);
            points.push(point);
        }
    }

    return points;
};

/**
 * 開始点からある方向に伸ばした線が対象となる線と交わる点を取得する
 * @param targetLine 対象となる Line [始点、終点、傾き、切片]
 * @param start 開始点
 * @param dir 方向
 * @returns 交点 [x, y]（なければ null）
 */
export const intercectPoint = (
    targetLine: [Vector, Vector, number, number],
    start: Vector,
    dir: Vector
): [number, number] | null => {
    const [pi, pj, slope1, intercept1] = targetLine;
    let point: [number, number] | null = null;
    try {
        // dir の傾き
        const end: Vector = start.clone().add(dir);
        const slope2 = end.x - start.x !== 0 ? (end.y - start.y) / (end.x - start.x) : NaN;
        // dir の切片
        const intercept2 = isNaN(slope2) ? NaN : start.y - slope2 * start.x;

        if (slope1 === slope2) {
            // 平行なので交点なし
            return null;
        }

        if (!isNaN(slope1) && !isNaN(slope2)) {
            // どちらも垂直でない
            const px = (intercept2 - intercept1) / (slope1 - slope2);
            const py = slope1 * px + intercept1;

            point = [px, py];
        } else if (isNaN(slope1)) {
            // 対象の Line が垂直
            const px = pi.x;
            const py = px * slope2 + intercept2;

            point = [px, py];
        } else if (isNaN(slope2)) {
            // dir が垂直
            const px = start.x;
            const py = px * slope1 + intercept1;

            point = [px, py];
        }

        // 交点が Line の内側？
        if (point) {
            const [x, y] = point;
            const rangeX = [pi.x, pj.x].sort((a, b) => a - b);
            const rangeY = [pi.y, pj.y].sort((a, b) => a - b);
            if (x >= rangeX[0] && x <= rangeX[1] && y >= rangeY[0] && y <= rangeY[1]) {
                return point;
            }
        }
        return null;
    } catch (err) {
        console.error(err);
    }

    return null;
};
