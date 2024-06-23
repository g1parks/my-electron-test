export class GUtil {

	// GUtil 1.0

    // 배열로 넘어온 객체에서 n개를 뽑는 컴비네이션 함수
    combination(array, n) {
        const results = [];

        if(n === 1) return array.map((el) => [el]);

        array.forEach((fixed, index, array) => {
            const new_arr = array.slice(index+1)
            const combo = this.combination(new_arr, n -1);
            const attached = combo.map((el) => [fixed, ...el]);
            results.push(...attached);
        });
        return results
    }

    //파라메터로 넘어온 배열 array에서  object 가 위치한 인덱스를 리턴
    getArrayIndexByObject(array, object){
        for(let i=0 ; i<array.length; i++){
            if(array[i] === object)
                return i;
        }
    }

    /*
    문자 또는 정수 배열을 받아서 최소값을 리턴
    배열 길이가 1이라면 첫번째 값을 그대로 리턴
    배열 길이가 1보다 작을 경우 null을 리턴

    @param array 1차원 배열
     */
    getMinFromArray(array){
        if(array.length < 1) return null;
        if(array.length === 1) return array[0];

        let result = array[0];

        for(let i = 1; i< array.length ; i++){
            if(result > array[i])
                result = array[i];
        }
        return result;
    }

    /*
    문자 또는 정수 배열을 받아서 최대값을 리턴
    배열 길이가 1이라면 첫번째 값을 그대로 리턴
    배여 길이가 1보다 작으면 null 을 리턴

    @param array 1차원 배열
     */
    getMaxFromArray(array){
        if(array.length < 1) return null;
        if(array.length === 1) return array[0];

        let result = array[0];

        for(let i = 1; i< array.length ; i++){
            if(result < array[i])
                result = array[i];
        }
        return result;
    }

    /*
    원본 텍스트에 있는 targetText를 alterText 로 변환 후 리턴
    @param originalText 원본 텍스트 전체
    @param targetText 변경 대상 텍스트
    @param alterText targetText 대신 교체되는 텍스트, null 이나 undefined 는 허용하지 않지만 공백은 허용
     */
    convertText(originalText, targetText, alterText){
        if(targetText === undefined || targetText === null)  // 대상텍스트
            return "convert failed: invalid targetText";

        if(alterText === undefined || alterText === null)     // 대체텍스트
            return "convert failed: invalid alterText";

        let temp = originalText.split(targetText);
        if(this.currentValue == ""){
            for(let i=1; i<temp.length; i++){
                if(temp[i].substr(0,1) == '\n')
                    temp[i] = temp[i].substr(1, temp[i].length-1);
            }
        }
        return temp.join(alterText);
    }

    /*
    2차원 배열의 특정 컬럼을 지정하여 해당 컬럼만을 가지는 1차원 배열을 추출
    조건이나 형식에 맞지 않는 것이 하나라도 나오면 빈배열이 리턴됨

    @param origin 배열 원본
    @param targetOffset 2차 배열에서 추출할 대상 인덱스
     */
    convert2ArrayTo1DArray(origin, targetOffset){
        let Array1D = [];
        for(let i=0; i<origin.length ; i++){
            if(origin[i].length <1)
                return [];
            Array1D[i] = origin[i][targetOffset];
        }
        return Array1D;
    }

    /*
    기준 오프셋부터 왼쪽방향으로 제일 먼저 발견되는 문자가 지정한 값과 일치할 경우 해당 문자를 제거한 결과를 리턴

    @param text 전체 텍스트 원본
    @param beginOffset 스캔을 시작할 기준 오프셋
    @param word 찾을 대상 문자열
     */
    findAndRemoveLeftWord(text, beginOffset, word){
        let foundOffset = this.isFirstString(text, beginOffset, word, true);
        if(foundOffset === -1)
            return text;

        let resultString = "";
        resultString += text.substring(0,foundOffset);
        resultString += text.substring(foundOffset+1, text.length);
        return resultString;
    }

    /*
    기준 오프셋(포함)부터 오른쪽 방향으로 스캔 중 처음 만나는 문자(열)가 지정한 문자(열)인지 체크
    지정한 문자를 처음 만났다면 해당 오프셋을 리턴
    그러지 못했다면 -1을 리턴

    @param text 전체 텍스트 원본
    @param startOffset 스캔을 시작할 기준 오프셋
    @param objectString 찾을 대상 문자열
    @param isReverse 스캔방향을 결정. true면 역방향(왼쪽->오른쪽)
     */
    isFirstString(text, startOffset, objectString, isReverse){
        if(isReverse !== true)   // isRevert 가 없거나 엉뚱한 값이면
            isReverse = false;   // 무조건 false 로 취급
        let currentOffset = -1;
        let length = text.length;
        let convertedSmallCase = text.toLowerCase();

        if(isReverse)
            currentOffset = startOffset -1;
        else
            currentOffset = startOffset + objectString.length;

        while(true) {
            let candidate = null;
            let currStr = convertedSmallCase[currentOffset];

            if (currentOffset <= 0 || currentOffset >= length)
                return -1;
            if (currStr === ' ' || currStr === '' || currStr === '\n' || currStr === '\r')  // 공백문자를 만나면
                isReverse ? (currentOffset--) : (currentOffset++);    // 오프셋을 증가, reverse true 면 왼쪽으로 스캔
            else {
                candidate = text.substr(currentOffset, objectString.length);
                if (candidate === objectString)
                    return currentOffset;
                else
                    return -1;
            }

        }
        return -1;
    }
}