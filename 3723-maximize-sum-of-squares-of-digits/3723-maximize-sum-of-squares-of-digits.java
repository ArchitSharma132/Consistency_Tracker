class Solution{
    public String maxSumOfSquares(int num,int sum){
        if(num*9<sum){
            return "";
        }
        char[] p=new char[num];
        for(int i=0;i<num;i++) {
            if(sum>=9){
                p[i]='9';
                sum-=9;
            }else{
                p[i]=(char)('0' + sum);
                sum=0;
            }
        }
        return new String(p);
    }
}