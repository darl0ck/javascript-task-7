'use strict';
/* eslint-disable */


exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    // асинхронная магия
    let queueOfJobs;
    queueOfJobs = jobs
        .map(_timer(timeout))
        .map((__element, __index) => [__element, __index]);
    let __res = [];
    let __countFinished = 0;

    function allRes(resolve, jobRes, jobIndex) {
        __res[jobIndex] = jobRes;
        ++__countFinished;
        if (jobs.length === __countFinished) {
            resolve(__res);
        } else if (queueOfJobs.length) {
            resolveJobs(resolve, ... queueOfJobs.shift());
        }
    }

    function resolveJobs(resolve, job, i) {
        let handler = jobResult => allRes(resolve, jobResult, i);
        job()
            .catch(handler)
            .then(handler)
            .catch(handler);
    }

    return new Promise(resolve => {
        let queue;
        if (parallelNum > 0 && jobs.length) {
            queue = queueOfJobs.splice(parallelNum);
            queueOfJobs.splice(parallelNum);
            queue
                .forEach(([__element, __index]) => resolveJobs(resolve, __element, __index));
        } else {
            resolve(__res);
        }
    });
}


function _timer(timeout) {
    return jobs => () => new Promise((resolve, reject) =>{
        jobs()
            .catch(reject)
            .then(resolve)
            .catch(reject);
        setTimeout(() => reject(new Error('run out of time')), timeout);
    });
}
