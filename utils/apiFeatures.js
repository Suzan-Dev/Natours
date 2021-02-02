class ApiFeatures {
  constructor(expressQueryObj, mongooseQueryObj) {
    this.expressQueryObj = expressQueryObj;
    this.mongooseQueryObj = mongooseQueryObj;
  }

  filter() {
    // Basic Filtering
    const queryObj = { ...this.expressQueryObj };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQueryObj = this.mongooseQueryObj.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    const { sort } = this.expressQueryObj;
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      this.mongooseQueryObj = this.mongooseQueryObj.sort(sortBy);
    } else {
      this.mongooseQueryObj = this.mongooseQueryObj.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    const { fields } = this.expressQueryObj;
    if (fields) {
      const limitFields = fields.split(',').join(' ');
      this.mongooseQueryObj = this.mongooseQueryObj.select(limitFields);
    } else {
      this.mongooseQueryObj = this.mongooseQueryObj.select('-__v');
    }

    return this;
  }

  paginate() {
    const { limit, page } = this.expressQueryObj;
    const pageNum = +page || 1;
    const limitNum = +limit || 100;
    const skipNum = (pageNum - 1) * limitNum;

    this.mongooseQueryObj = this.mongooseQueryObj.skip(skipNum).limit(limitNum);

    return this;
  }
}

module.exports = ApiFeatures;
