import {GCanvasDelegator} from './GCanvasDelegator.js';
import {GUtil} from './GUtil.js';

export class GChart {

    static LINE_CHART_LEFT_MARGIN = 30;
    static LINE_CHART_RIGHT_MARGIN = 30;
    static LINE_CHART_TOP_MARGIN = 30;
    static LINE_CHART_BOTTOM_MARGIN = 30;
    static MAX_GRID_CNT_X = 10;
    static MAX_GRID_CNT_Y = 10;
    static MAX_HEIGHT_RATIO = 0.8;      //  0~1 사이의 값
    static AXIS_DESC_SIZE = 20;         // x/y 축 설명 텍스트 폰트 사이즈
    static TITLE_FONT_SIZE = 20;
    static INFO_FONT_SIZE = 15;


    /*
    라인차트 생성 - 날짜별 카운트

    @param cvsUtilInst 초기화가 완료된 GCanvasUtil 객체
    @param numberPerDateObjects 동일한 간격의 날짜와 그에 따른 정수를 가지는 객체 배열, 형식은 {"yyyy-mm-dd":N }
    @param guideInfo 차트 정보 렌더링을 위한 옵션 설정용 객체, 형식은 {title:"차트제목", xDesc:"x축 설명", yDesc:"y축설명"}
	@param tension 곡선의 굴곡 정도를 결정하는 가중치
     */
    createLineChart_CountPerDate(cvsUtilInst, numberPerDateObjects, guideInfo, tension = 0){

        //cvsUtilInst.drawLine(50,10,5,10,1, "#000000");
        //cvsUtilInst.drawLine(5,5,50,5,1, "#000000");

        //return;
        let marginInfo = this.drawXYGuideLine(cvsUtilInst, guideInfo, {
            top : GChart.LINE_CHART_TOP_MARGIN,
            bottom : GChart.LINE_CHART_BOTTOM_MARGIN,
            left : GChart.LINE_CHART_LEFT_MARGIN,
            right : GChart.LINE_CHART_RIGHT_MARGIN});       // x,y 축 가이드라인과 설명문구등을 렌더링하고 최종 여백 정보를 리턴해준다

        let xAxisLength = cvsUtilInst.width - marginInfo.left - marginInfo.right ;   // 차트의 x축길이
        let yAxisLength = cvsUtilInst.height - marginInfo.top - marginInfo.bottom;  // y축 길이
        //let titleHeight = marginInfo.top - GChart.LINE_CHART_TOP_MARGIN;

        const entries = Object.entries(numberPerDateObjects);
        let dateArray = [];
        let nArray = [];
        for(let i=0; i<entries.length ; i++){                       // 사용하기 편하도록 1차원 배열로 쪼개어 놓음
            dateArray.push(entries[i][0]);
            nArray.push(entries[i][1]);
            //console.log("x,y = "+dateArray[i] +","+nArray[i]);
        }

        // x축에 직교하는 그리드라인
        let maxGridCountX = dateArray.length < GChart.MAX_GRID_CNT_X ? dateArray.length : GChart.MAX_GRID_CNT_X;
        let widthPerStep = xAxisLength / maxGridCountX;
        for(let i=0; i<maxGridCountX ; i++) {
            cvsUtilInst.drawLine(
                marginInfo.left + (widthPerStep * i),
                marginInfo.top,
                marginInfo.left + (widthPerStep * i),
                cvsUtilInst.height - marginInfo.bottom, 1, "#858585");
            cvsUtilInst.drawText(
                entries[i][0],
                marginInfo.left + (widthPerStep * i),
                cvsUtilInst.height - marginInfo.bottom + 15, {
                    lineWidth : 2
                });
        }

        let minValueY = new GUtil().getMinFromArray(nArray);     // y축에 입력되는 최소값 (최소 높이)
        let maxValueY = new GUtil().getMaxFromArray(nArray);     // y축에 입력되는 최대값 (최대 높이)

        let maxGridCountY = GChart.MAX_GRID_CNT_Y;      // y축 그리드 수
        let heightPerStep = yAxisLength / maxGridCountY;    // 그리드 한 칸에 대응하는 실제 픽셀 사이즈
        let countPerStep = maxValueY / maxGridCountY;        // 그리드 한 칸 에 대응하는 카운트

        let validRange = maxValueY;                // 데이터가 존재하는 유효 구간의 크기. 디폴트는 0~maxY, 즉 최대Y값이 됨
        let transformatedValidRange = yAxisLength;       // 렌더링이 이루어지는 유효 구간의 크기
        let transformatedMaxGridCountY = maxGridCountY;
        let bottomPosition = 0;                      // y축 기준, 처음 렌더링을 시작하는 위치
        let bottomValue = 0;

        // 트렌드가 차트 윗쪽으로 치우쳐있는지 체크하고 기준값들을 보정하기
        if(countPerStep*(maxGridCountY-1) < maxValueY){         // y축 양의 방향 N-1번째 그리드보다 최대값이 더 크면 (차트에서 마지막그리드를 넘어서면)
            countPerStep = maxValueY/ (maxGridCountY-1);        // 그리드 한칸당 대응하는 카운트 수를 늘림
            transformatedValidRange -= heightPerStep;           // 렌더링 유효 구간도 그리드 한칸만큼 줄임.
            transformatedMaxGridCountY = maxGridCountY-1;       // 렌더링 유효 구간을 그리드 개수로도 표시해둠
        }

        if(countPerStep * GChart.MAX_GRID_CNT_Y * 0.5 < minValueY){// 최소값이 차트 절반을 넘어서는 위치에 있을 경우
            validRange = maxValueY - minValueY;                 // 유효 범위를 절대값 대신 최대 최소 차이값으로 대신한다
            maxGridCountY-=2;
            countPerStep = validRange/ (transformatedMaxGridCountY-=2);     // 그리드 한 칸에 대응하는 카운트를 재계산
            transformatedValidRange -= heightPerStep*2;         // 렌더링 유효 구간도 줄어든 유효범위에 맞게 축소
            bottomPosition = heightPerStep*2;                   // 바닥에 생략표시를 넣어야하므로 보정을 위해 두칸(이 필요함)만큼 렌더링 시작 위치 보정
            bottomValue = minValueY;
        }

        if(bottomValue > 0){                                    // 최소값 보정이 필요한 경우 생략표시선을 차트 하단에 그려준다
            let diagonalCount = Math.floor(GChart.MAX_GRID_CNT_X*1.5);
            let diagonalWidth = xAxisLength/ diagonalCount;
            for(let i=1; i<= diagonalCount ; i+=2){
                let x0 = (diagonalWidth * (i-1))-1.5;
                let y0 = heightPerStep-5;
                let x1 = (diagonalWidth * i)+1.5;
                let y1 = heightPerStep + 5;
                cvsUtilInst.drawLine(
                    marginInfo.left +x0,
                    cvsUtilInst.height - marginInfo.bottom -y0,
                    marginInfo.left +x1,
                    cvsUtilInst.height - (marginInfo.bottom) -y1,
                    10);
                cvsUtilInst.drawLine(
                    marginInfo.left +x0-1,
                    cvsUtilInst.height - marginInfo.bottom -y0,
                    marginInfo.left +x1+1,
                    cvsUtilInst.height - (marginInfo.bottom) -y1,
                    8, "#FFFFFF");

            }
            for(let i=2; i<= diagonalCount ; i+=2){
                let x0 = (diagonalWidth * (i-1))-1.5;
                let y0 = heightPerStep+5;
                let x1 = (diagonalWidth * i)+1.5;
                let y1 = heightPerStep-5;
                cvsUtilInst.drawLine(
                    marginInfo.left +x0,
                    cvsUtilInst.height - marginInfo.bottom -y0,
                    marginInfo.left +x1,
                    cvsUtilInst.height - (marginInfo.bottom) -y1,
                    10);
                cvsUtilInst.drawLine(
                    marginInfo.left +x0-1,
                    cvsUtilInst.height - marginInfo.bottom -y0,
                    marginInfo.left +x1+1,
                    cvsUtilInst.height - (marginInfo.bottom) -y1,
                    8, "#FFFFFF");
            }

        }

        // y축에 직교하는 그리드 라인
        for(let i=0; i<maxGridCountY ; i++) {
            cvsUtilInst.drawLine(                                   // 그리드 선
                marginInfo.left,
                cvsUtilInst.height - marginInfo.bottom - (heightPerStep * i) - bottomPosition ,
                cvsUtilInst.width - marginInfo.right,
                cvsUtilInst.height - marginInfo.bottom - (heightPerStep * i) - bottomPosition,
                1, "#858585");

            cvsUtilInst.drawText(                                   // 기준수치(눈금당 간격) 정보
                Math.floor((countPerStep * i) + bottomValue),
                marginInfo.left-GChart.LINE_CHART_LEFT_MARGIN,
                cvsUtilInst.height - marginInfo.bottom - (heightPerStep * i) - bottomPosition,
                { lineWidth :1 });
        }
        if(bottomValue > 0)
            cvsUtilInst.drawText("0", marginInfo.left-GChart.LINE_CHART_LEFT_MARGIN, cvsUtilInst.height - marginInfo.bottom,
                {lineWidth:1});  // 0 표시


        // 최종 트렌드 선 그리기
		if(tension === 0) {		// 텐션이 없다면 직선으로 취급
            for(let i=1 ; i<maxGridCountX; i++){
				let x0 = widthPerStep * (i-1);
				let y0 =  transformatedValidRange * (nArray[i-1]-bottomValue)/validRange;
				let x1 = widthPerStep * i;
				let y1 = transformatedValidRange * (nArray[i]-bottomValue)/validRange;
				//let heightCap = y_size * (1-GChart.MAX_HEIGHT_RATIO); // 최대높이 제한

				cvsUtilInst.drawLine(
					marginInfo.left + x0,
					cvsUtilInst.height - marginInfo.bottom - y0 - bottomPosition,
					marginInfo.left + x1,
					cvsUtilInst.height - marginInfo.bottom - y1 - bottomPosition,
					2, "#714D84"
				)
			}
		}
		else	{	// 텐션값이 있다면 곡선으로 취급
			let points = [];
			for(let i=0 ; i<maxGridCountX; i++){
				let x = marginInfo.left + widthPerStep * i;
				let y = cvsUtilInst.height - marginInfo.bottom - (transformatedValidRange * (nArray[i]-bottomValue)/validRange) - bottomPosition;
				points.push({ x, y });
			}
			cvsUtilInst.drawContinuousCurve(points, tension, 2, "#714D84");
		}

    }

    /*
    2차원 XY축 및 타이틀, 설명등을 렌더링한다
     */
    drawXYGuideLine(cvsUtilInst, guideInfo, marginInfo){

        let resultMarginInfo = {
            top : marginInfo.top,
            bottom : marginInfo.bottom,
            left : marginInfo.left,
            right : marginInfo.right};

        if(guideInfo) {                   // guidInfo 객체가 존재하는 경우만 수행
            // 타이틀
            if (guideInfo.title) {        // 타이틀 텍스트가 존재하면
                let titleWidth = new GCanvasDelegator().getRenderedTextWidth(
                    guideInfo.title, {
                        name: "Tahoma",
                        isBold: true,
                        size: GChart.TITLE_FONT_SIZE
                    });

                cvsUtilInst.drawText(
                    guideInfo.title,
                    (cvsUtilInst.width - titleWidth) * 0.5,
                    5 + GChart.TITLE_FONT_SIZE,
                    {
                        lineWidth: 1,
                        size: GChart.TITLE_FONT_SIZE,
                        isBold: true
                    });

                resultMarginInfo.top += GChart.TITLE_FONT_SIZE;
            }

            // x축 설명
            if (guideInfo.xDesc) {
                let xDescWidth = new GCanvasDelegator().getRenderedTextWidth(
                    guideInfo.xDesc, {
                        name: "Tahoma",
                        size: GChart.INFO_FONT_SIZE
                    });

                cvsUtilInst.drawText(
                    guideInfo.xDesc,
                    (cvsUtilInst.width - xDescWidth) * 0.5,
                    cvsUtilInst.height - GChart.INFO_FONT_SIZE,
                    {
                        name: "Tahoma",
                        size: GChart.INFO_FONT_SIZE
                    });

                resultMarginInfo.bottom += GChart.INFO_FONT_SIZE+5;
            }
            // y축 설명
            if (guideInfo.yDesc) {
                let yDescWidth = new GCanvasDelegator().getRenderedTextWidth(
                    guideInfo.yDesc, {
                        name: "Tahoma",
                        isBold : true,
                        size: GChart.INFO_FONT_SIZE
                    });

                cvsUtilInst.drawAngledText(
                    guideInfo.yDesc,
                    -(yDescWidth-GChart.INFO_FONT_SIZE),
                    (cvsUtilInst.height - yDescWidth) * 0.5,
                    90,
                    {
                        name: "Tahoma",
                        isBold : true,
                        size: GChart.INFO_FONT_SIZE
                    });

                resultMarginInfo.left += GChart.INFO_FONT_SIZE+5;
            }

        }

        // x축
        cvsUtilInst.drawLine(
            resultMarginInfo.left,
            cvsUtilInst.height - resultMarginInfo.bottom,
            cvsUtilInst.width - resultMarginInfo.right,
            cvsUtilInst.height - resultMarginInfo.bottom);

        // Y축
        cvsUtilInst.drawLine(
            resultMarginInfo.left,
            resultMarginInfo.top,
            resultMarginInfo.left,
            cvsUtilInst.height - resultMarginInfo.bottom);

        return resultMarginInfo;

    }
