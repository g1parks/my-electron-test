export class GCanvasDelegator {
    
    // GCanvasDelegator 1.01	리팩토링(코드 중복 제거)

    // 기본 설정 상수
    static DEFAULT_WIDTH = 1024;
    static DEFAULT_HEIGHT = 768;
    static DEFAULT_FONT_SIZE = 11;
    static DEFAULT_FONT_NAME = "Tahoma";
    static DEFAULT_HTML_COLOR_CODE = "#8F8F8F";

    rootPanelID = null;
    _canvas = null;
    _width = GCanvasDelegator.DEFAULT_WIDTH;
    _height = GCanvasDelegator.DEFAULT_HEIGHT;
    _dpr = window.devicePixelRatio;

    // 캔버스의 너비를 가져오거나 설정합니다.
    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;
    }

    // 캔버스의 높이를 가져오거나 설정합니다.
    get height() {
        return this._height;
    }

    set height(value) {
        this._height = value;
    }

    // 장치 픽셀 비율을 가져오거나 설정합니다.
    get dpr() {
        return this._dpr;
    }

    set dpr(value) {
        this._dpr = value;
    }

    /**
     * 캔버스를 초기화합니다.
     * @param {number} w 캔버스의 너비
     * @param {number} h 캔버스의 높이
     * @param {string|null} rootPanelID 캔버스를 추가할 루트 패널의 ID
     * @param {number} dpr 장치 픽셀 비율
     */
    initCanvas(w = 200, h = 200, rootPanelID = null, dpr = window.devicePixelRatio) {
        this.dpr = dpr;
        this.width = w;
        this.height = h;
        this.rootPanelID = rootPanelID;

        let canvas = this.getOrCreateCanvas();
        canvas.width = w * this.dpr;
        canvas.height = h * this.dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        if (rootPanelID !== null) {
            const rootElement = document.getElementById(this.rootPanelID);
            if (rootElement) {
                rootElement.innerHTML = '';
                rootElement.appendChild(canvas);
            } else {
                throw new Error(`Element with ID ${rootPanelID} not found.`);
            }
        }
    }

    /**
     * 캔버스를 생성하거나 기존 캔버스를 반환합니다.
     * @returns {HTMLCanvasElement} 생성된 캔버스 요소
     */
    getOrCreateCanvas() {
        let canvas = this._canvas || document.getElementById(`${this.rootPanelID}_cvs`);
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = `${this.rootPanelID}_cvs`;
            if (this.rootPanelID) {
                const rootElement = document.getElementById(this.rootPanelID);
                if (rootElement) {
                    rootElement.appendChild(canvas);
                } else {
                    throw new Error(`Element with ID ${this.rootPanelID} not found.`);
                }
            }
            this._canvas = canvas;
        }
        return canvas;
    }

    /**
     * 선을 그립니다.
     * @param {number} startX 시작점의 x좌표
     * @param {number} startY 시작점의 y좌표
     * @param {number} endX 끝점의 x좌표
     * @param {number} endY 끝점의 y좌표
     * @param {number} [lineWidth=1] 선의 너비
     * @param {string} [HTMLStrokeColor="#858585"] 선의 색상
     */
    drawLine(startX, startY, endX, endY, lineWidth = 1, HTMLStrokeColor = "#858585") {
        const ctx = this.getCanvasContext();
        if (!ctx) return;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.beginPath();

        if (lineWidth % 2 === 1) {
            startX += 0.5;
            startY += 0.5;
        }

        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = HTMLStrokeColor;
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 텍스트를 그립니다.
     * @param {string} text 그릴 텍스트
     * @param {number} x 텍스트의 x좌표
     * @param {number} y 텍스트의 y좌표
     * @param {object} fontOptions 폰트 옵션
     */
    drawText(text, x, y, fontOptions) {
        const ctx = this.getCanvasContext();
        if (!ctx) return;

        fontOptions = this.validateFontOptions(fontOptions);
        this.setupCanvasContext(ctx, fontOptions);

        if (fontOptions.lineWidth % 2 === 1) {
            x += 0.5;
            y += 0.5;
        }

        ctx.textAlign = "start";
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    /**
     * 각도 있는 텍스트를 그립니다.
     * @param {string} text 그릴 텍스트
     * @param {number} x 텍스트의 x좌표
     * @param {number} y 텍스트의 y좌표
     * @param {number} angle 텍스트의 각도
     * @param {object} fontOptions 폰트 옵션
     */
    drawAngledText(text, x, y, angle, fontOptions) {
        const ctx = this.getCanvasContext();
        if (!ctx) return;

        fontOptions = this.validateFontOptions(fontOptions);
        this.setupCanvasContext(ctx, fontOptions);

        if (fontOptions.lineWidth % 2 === 1) {
            x += 0.5;
            y += 0.5;
        }

        const tempRenderedText = ctx.measureText(text);
        const transX = x + (tempRenderedText.width * 0.5);
        const transY = y + (fontOptions.size * 0.5);
        ctx.translate(transX, transY);
        ctx.rotate(angle * Math.PI / 180);
        ctx.translate(-transX, -transY);
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    /**
     * 주어진 텍스트의 렌더링 너비를 계산합니다.
     * @param {string} text 텍스트
     * @param {object} fontOptions 폰트 옵션
     * @returns {number} 텍스트의 렌더링 너비
     */
    getRenderedTextWidth(text, fontOptions) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = GCanvasDelegator.DEFAULT_WIDTH;
        tempCanvas.height = GCanvasDelegator.DEFAULT_HEIGHT;

        fontOptions = this.validateFontOptions(fontOptions);
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return 0;

        this.setupCanvasContext(ctx, fontOptions);
        return ctx.measureText(text).width;
    }

    /**
     * 폰트 옵션을 검증하고 기본값을 설정합니다.
     * @param {object} fontOptions 폰트 옵션
     * @returns {object} 검증된 폰트 옵션
     */
    validateFontOptions(fontOptions = {}) {
        return {
            size: fontOptions.size || GCanvasDelegator.DEFAULT_FONT_SIZE,
            name: fontOptions.name || GCanvasDelegator.DEFAULT_FONT_NAME,
            strokeColorCode: fontOptions.strokeColorCode || GCanvasDelegator.DEFAULT_HTML_COLOR_CODE,
            fillColorCode: fontOptions.fillColorCode || GCanvasDelegator.DEFAULT_HTML_COLOR_CODE,
            lineWidth: fontOptions.lineWidth || 1,
            isBold: fontOptions.isBold || false
        };
    }

    /**
     * 캔버스 컨텍스트를 설정합니다.
     * @param {CanvasRenderingContext2D} ctx 캔버스 컨텍스트
     * @param {object} fontOptions 폰트 옵션
     */
    setupCanvasContext(ctx, fontOptions) {
        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.font = `${fontOptions.isBold ? "bold " : ""}${fontOptions.size}px ${fontOptions.name}`;
        ctx.fillStyle = fontOptions.fillColorCode;
        ctx.strokeStyle = fontOptions.strokeColorCode;
    }

    /**
     * 캔버스 컨텍스트를 반환합니다.
     * @returns {CanvasRenderingContext2D|null} 캔버스 컨텍스트 또는 null
     */
    getCanvasContext() {
        const canvas = this.getOrCreateCanvas();
        if (!canvas) return null;
        return canvas.getContext("2d");
    }
    
    /**
     * 곡선을 그립니다.
     * @param {number} startX 시작점의 x좌표
     * @param {number} startY 시작점의 y좌표
     * @param {number} endX 끝점의 x좌표
     * @param {number} endY 끝점의 y좌표
     * @param {number} controlX 곡선의 가중치 x좌표
     * @param {number} controlY 곡선의 가중치 y좌표
     * @param {number} [lineWidth=1] 선의 너비
     * @param {string} [HTMLStrokeColor="#858585"] 선의 색상
     */
    drawCurve(startX, startY, endX, endY, controlX, controlY, lineWidth = 1, HTMLStrokeColor = "#858585") {
        const ctx = this.getCanvasContext();
        if (!ctx) return;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.beginPath();

        if (lineWidth % 2 === 1) {
            startX += 0.5;
            startY += 0.5;
        }

        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = HTMLStrokeColor;
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * 연속된 좌표 배열을 받아 연속적인 곡선을 그립니다.
     * @param {Array} points 좌표 배열, 각 원소는 {x, y} 형식
     * @param {number} tension 곡선의 굴곡 정도를 결정하는 가중치
     * @param {number} [lineWidth=1] 선의 너비
     * @param {string} [HTMLStrokeColor="#858585"] 선의 색상
     */
    drawContinuousCurve(points, tension = 0.5, lineWidth = 1, HTMLStrokeColor = "#858585") {
       const ctx = this.getCanvasContext();
        if (!ctx || points.length < 2) return;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.beginPath();

        const getControlPoints = (p0, p1, p2, p3, t) => {
            const d01 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
            const d12 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            const d23 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));

            const fa = t * d01 / (d01 + d12);
            const fb = t * d23 / (d12 + d23);

            const p1x = p1.x + fa * (p2.x - p0.x);
            const p1y = p1.y + fa * (p2.y - p0.y);

            const p2x = p2.x - fb * (p3.x - p1.x);
            const p2y = p2.y - fb * (p3.y - p1.y);

            return [{x: p1x, y: p1y}, {x: p2x, y: p2y}];
        };

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 > points.length - 1 ? points.length - 1 : i + 2];

            const [cp1, cp2] = getControlPoints(p0, p1, p2, p3, tension);

            if (i === 0) {
                ctx.moveTo(p1.x, p1.y);
            }

            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
        }

        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = HTMLStrokeColor;
        ctx.stroke();
        ctx.restore();
    }
	
	/**
     * 네 개의 좌표를 받아 곡선을 그립니다.
     * @param {number} x1 시작점의 x좌표
     * @param {number} y1 시작점의 y좌표
     * @param {number} x2 제어점 1의 x좌표
     * @param {number} y2 제어점 1의 y좌표
     * @param {number} x3 제어점 2의 x좌표
     * @param {number} y3 제어점 2의 y좌표
     * @param {number} x4 끝점의 x좌표
     * @param {number} y4 끝점의 y좌표
     * @param {string} [HTMLStrokeColor="#858585"] 선의 색상
     */
    drawBezierCurve(x1, y1, x2, y2, x3, y3, x4, y4, HTMLStrokeColor = "#858585") {
        const ctx = this.getCanvasContext();
        if (!ctx) return;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x2, y2, x3, y3, x4, y4);
        ctx.strokeStyle = HTMLStrokeColor;
        ctx.stroke();
        ctx.restore();
    }
	
	// 새로 추가된 메서드
    drawComplexShape(leftTopX, leftTopY, rightTopX, rightTopY, leftBottomX, leftBottomY, rightBottomX, rightBottomY, fillColor = "#FF0000", strokeColor = "#000000") {
		const ctx = this.getCanvasContext();
		if (!ctx) return;

		const drawCurve = (startX, startY, endX, endY, controlOffset) => {
			const yDiff = endY - startY;
			if (yDiff === 0) {
				// 좌표의 높이가 같은 경우 직선
				ctx.lineTo(endX, endY);
			} else if (yDiff > 0) {
				// 오른쪽이 아래에 있는 경우
				const controlX1 = startX + (endX - startX) / 3;
				const controlY1 = startY - controlOffset;
				const controlX2 = startX + 2 * (endX - startX) / 3;
				const controlY2 = endY + controlOffset;
				ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
			} else {
				// 오른쪽이 위에 있는 경우
				const controlX1 = startX + (endX - startX) / 3;
				const controlY1 = startY + controlOffset;
				const controlX2 = startX + 2 * (endX - startX) / 3;
				const controlY2 = endY - controlOffset;
				ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
			}
		};

		ctx.save();
		ctx.scale(this.dpr, this.dpr);
		ctx.beginPath();

		// 좌측 세로 직선
		ctx.moveTo(leftTopX, leftTopY);
		ctx.lineTo(leftBottomX, leftBottomY);

		// 하단 곡선
		drawCurve(leftBottomX, leftBottomY, rightBottomX, rightBottomY, 0);

		// 우측 세로 직선
		ctx.lineTo(rightTopX, rightTopY);

		// 상단 곡선
		drawCurve(rightTopX, rightTopY, leftTopX, leftTopY, 0);

		ctx.closePath();
		ctx.fillStyle = fillColor;
		ctx.fill();
		ctx.strokeStyle = strokeColor;
		ctx.stroke();
		ctx.restore();
	}

}