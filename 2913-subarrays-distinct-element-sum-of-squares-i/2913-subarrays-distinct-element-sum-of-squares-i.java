class Solution{
    public int sumCounts(List<Integer> nums){
        int n=nums.size();
        int sum=0;
        for(int i=0;i<n;i++){
            HashSet<Integer> h=new HashSet<>();
            for(int j=i;j<n;j++){
                h.add(nums.get(j));
                sum+=h.size()*h.size();
            }
        }
        return sum;
    }
}